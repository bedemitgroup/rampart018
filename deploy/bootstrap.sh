#!/usr/bin/env bash
#
# One-time hardening + Docker install for a fresh Hetzner CX22 (Ubuntu 24.04).
# Run as root, right after the server is created:
#
#   ssh root@<server-ip> 'bash -s' < deploy/bootstrap.sh <your-ssh-public-key>
#
# or copy it over and run:  bash bootstrap.sh "ssh-ed25519 AAAA... you@host"
#
# Creates an unprivileged sudo user "bedem", locks SSH down to that user's key,
# turns on the firewall and automatic security updates, and installs Docker.

set -euo pipefail

PUBKEY="${1:-}"
NEW_USER="bedem"

if [[ $EUID -ne 0 ]]; then echo "Run as root." >&2; exit 1; fi
if [[ -z "$PUBKEY" ]]; then
    echo "Pass your SSH public key as the first argument, or you will be locked out." >&2
    exit 1
fi

echo ">>> Timezone"
timedatectl set-timezone Europe/Belgrade

echo ">>> Base packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl gnupg ufw fail2ban unattended-upgrades

echo ">>> Swap"
# The 2 GB plans have no headroom for a container image build (dotnet publish,
# vite build) while Postgres is running. A swapfile absorbs the spikes; on a
# box with more RAM it simply stays unused. Skip if swap already exists.
if [[ ! -f /swapfile && "$(swapon --show --noheadings | wc -l)" -eq 0 ]]; then
    fallocate -l 3G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=3072
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    sysctl -w vm.swappiness=10
    echo 'vm.swappiness=10' > /etc/sysctl.d/99-swappiness.conf
fi

echo ">>> User: $NEW_USER"
if ! id "$NEW_USER" &>/dev/null; then
    adduser --disabled-password --gecos "" "$NEW_USER"
fi
usermod -aG sudo "$NEW_USER"
install -d -m 700 -o "$NEW_USER" -g "$NEW_USER" "/home/$NEW_USER/.ssh"
echo "$PUBKEY" > "/home/$NEW_USER/.ssh/authorized_keys"
chmod 600 "/home/$NEW_USER/.ssh/authorized_keys"
chown "$NEW_USER:$NEW_USER" "/home/$NEW_USER/.ssh/authorized_keys"
# Passwordless sudo so deploy.sh can run non-interactively.
echo "$NEW_USER ALL=(ALL) NOPASSWD:ALL" > "/etc/sudoers.d/90-$NEW_USER"
chmod 440 "/etc/sudoers.d/90-$NEW_USER"

echo ">>> SSH hardening"
# A drop-in wins over the stock config and any cloud-init drop-in, whatever
# state they are in. Verify the new user's key works BEFORE this takes effect
# (the script already wrote authorized_keys above).
if [[ ! -s "/home/$NEW_USER/.ssh/authorized_keys" ]]; then
    echo "authorized_keys for $NEW_USER is empty - refusing to disable password auth." >&2
    exit 1
fi
cat > /etc/ssh/sshd_config.d/99-bedem.conf <<EOF
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
EOF
sshd -t
systemctl restart ssh

echo ">>> Firewall"
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo ">>> fail2ban (sshd)"
systemctl enable --now fail2ban

echo ">>> Automatic security updates"
dpkg-reconfigure -f noninteractive unattended-upgrades

echo ">>> Docker"
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
usermod -aG docker "$NEW_USER"
systemctl enable --now docker

install -d -m 755 -o "$NEW_USER" -g "$NEW_USER" /opt/bedem

cat <<EOF

>>> Done.

Next:
  1. Log in as the new user (root login is now disabled):
       ssh $NEW_USER@<server-ip>
  2. Add a read-only deploy key to the GitHub repo, then:
       git clone git@github.com:<owner>/<repo>.git /opt/bedem
  3. Create /opt/bedem/.env from .env.example (fill every secret).
  4. deploy/deploy.sh
  5. Set up backups: deploy/backup-setup.md

Note: containers publish 80/443 via Docker's own iptables rules, so ufw does
not gate them - that is intended. Postgres and the API publish no ports at all.
EOF
