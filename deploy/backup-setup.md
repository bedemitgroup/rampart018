# Backup setup (one-time)

Two layers:

1. **Hetzner automatic Backups** — enable in the Cloud Console on the server
   (Backups tab). +20% of the server price, daily full-server image, last 7 kept.
   For fast whole-server recovery. Not weekly, not offsite.

2. **Weekly `restic` -> Hetzner Storage Box** — the steps below. Offsite,
   encrypted, deduplicated, longer retention. This is the one that matters.

---

## 1. Order a Storage Box

Cloud Console -> Storage Box -> **BX11** (1 TB, ~€3.80/mo). Enable **SSH support**
in its settings. Note the username (`uXXXXXX`) and host (`uXXXXXX.your-storagebox.de`).

## 2. SSH key for the Storage Box (run as `bedem` on the server, `sudo -i` for root cron)

Backups run from root's crontab, so set this up for root:

```bash
sudo -i
ssh-keygen -t ed25519 -f /root/.ssh/id_ed25519 -N ""     # if not present

cat >> /root/.ssh/config <<'EOF'

Host bedem-storagebox
    HostName uXXXXXX.your-storagebox.de
    User uXXXXXX
    Port 23
    IdentityFile /root/.ssh/id_ed25519
EOF
chmod 600 /root/.ssh/config

# Upload the public key to the Storage Box (password auth, one time):
ssh-copy-id -s -p 23 uXXXXXX@uXXXXXX.your-storagebox.de
```

## 3. restic

```bash
apt-get install -y restic

cat > /opt/bedem/backup.env <<'EOF'
RESTIC_REPOSITORY=sftp:bedem-storagebox:/bedem
RESTIC_PASSWORD_FILE=/opt/bedem/.restic-pass
EOF
chmod 600 /opt/bedem/backup.env

# Repository encryption passphrase - GENERATE, then store in the password manager.
openssl rand -base64 32 > /opt/bedem/.restic-pass
chmod 600 /opt/bedem/.restic-pass

set -a; . /opt/bedem/backup.env; set +a
restic init
```

> **Write the restic passphrase into the password manager now.** Without it the
> backups are unrecoverable.

## 4. Schedule (root crontab, Sundays 03:00 Europe/Belgrade)

```bash
( crontab -l 2>/dev/null; \
  echo '0 3 * * 0 /opt/bedem/deploy/backup.sh >> /var/log/bedem-backup.log 2>&1' \
) | crontab -
```

## 5. Test now, and test a restore

```bash
/opt/bedem/deploy/backup.sh          # should finish with "... done"
restic snapshots
```

Then run a real restore into throwaway locations — see `deploy/restore.md`.
A backup you have not restored is not a backup.
