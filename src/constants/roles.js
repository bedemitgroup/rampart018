// Mirrors backend/BedemApi/Models/Roles.cs. The server is what actually enforces
// any of this — everything here only decides what the UI bothers to render, so a
// stale copy costs a 403 instead of a hole.

export const ROLES = {
  ADMIN: 'Admin',
  MODERATOR: 'Moderator',
  FINANCE: 'Finance',
  ASSEMBLY: 'Assembly',
  MEMBER: 'Member',
  VISITOR: 'Visitor',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.MODERATOR]: 'Moderator',
  [ROLES.FINANCE]: 'Finansije',
  [ROLES.ASSEMBLY]: 'Skupština',
  [ROLES.MEMBER]: 'Aktivni član',
  [ROLES.VISITOR]: 'Posetilac',
};

// What each role is for, shown next to the role picker so an admin does not
// have to keep the table in his head.
export const ROLE_DESCRIPTIONS = {
  [ROLES.ADMIN]: 'Puna prava nad sajtom, nalozima i dnevnikom izmena.',
  [ROLES.MODERATOR]: 'Aktivni član + upravlja vestima, prijavama i zahtevima za članstvo.',
  [ROLES.FINANCE]: 'Aktivni član + upravlja finansijama.',
  [ROLES.ASSEMBLY]: 'Aktivni član + saziva skupštinu i vodi dnevni red.',
  [ROLES.MEMBER]: 'Član udruženja: glasa na skupštini, komentariše i lajkuje.',
  [ROLES.VISITOR]: 'Registrovan nalog: samo komentari i lajkovi.',
};

// Roles an admin hands out when creating an account. Admin is missing on
// purpose — promoting to Admin is a separate step, same as on the server.
export const CREATABLE_ROLES = [
  ROLES.MODERATOR,
  ROLES.FINANCE,
  ROLES.ASSEMBLY,
  ROLES.MEMBER,
];

export const ALL_ROLES = [
  ROLES.ADMIN,
  ROLES.MODERATOR,
  ROLES.FINANCE,
  ROLES.ASSEMBLY,
  ROLES.MEMBER,
  ROLES.VISITOR,
];

export function roleLabel(role) {
  return ROLE_LABELS[role] || role || '';
}

const holds = (user, ...roles) => !!user && roles.includes(user.role);

export const canManageNews = (user) => holds(user, ROLES.MODERATOR, ROLES.ADMIN);
export const canManageFinance = (user) => holds(user, ROLES.FINANCE, ROLES.ADMIN);
export const canManageAssembly = (user) => holds(user, ROLES.ASSEMBLY, ROLES.ADMIN);
export const canManageSubmissions = (user) => holds(user, ROLES.MODERATOR, ROLES.ADMIN);
export const canManageComments = (user) => holds(user, ROLES.MODERATOR, ROLES.ADMIN);
export const canManageUsers = (user) => holds(user, ROLES.ADMIN);

// Who actually sits in the assembly: has a seat in the hall, counts towards the
// quorum, is scored for turning up, and votes. Mirrors Roles.AssemblyParticipants.
//
// A Visitor is absent because registering on the site is not membership. An
// Admin is absent for a different reason: he runs a sitting (canManageAssembly)
// but does not decide in it, so a technical account carries no vote.
export const canVoteInAssembly = (user) =>
  holds(user, ROLES.MEMBER, ROLES.MODERATOR, ROLES.FINANCE, ROLES.ASSEMBLY);

// Reading the panel and writing in it are separate: everyone the organisation
// admitted may look at what the others are doing, but only his own section
// gets buttons. Accounts and the audit log are the exception — those are about
// oversight of the staff itself and stay with the Admin.
export const canAccessAdmin = (user) =>
  holds(user, ROLES.MEMBER, ROLES.MODERATOR, ROLES.FINANCE, ROLES.ASSEMBLY, ROLES.ADMIN);

// Where the admin panel drops you: your own section if you have one, otherwise
// the news list, which is what a read-only visit is usually about.
export function adminLandingPath(user) {
  if (canManageAssembly(user) && !canManageNews(user)) return '/admin/skupstina';
  if (canManageFinance(user) && !canManageNews(user)) return '/admin/finance';
  if (canAccessAdmin(user)) return '/admin/news';
  return '/';
}
