// The backend stores stable English constants (AuditActions / AuditEntityTypes)
// and never a translated string, so the wording can change here without a
// migration. Anything not in these maps falls back to the raw code rather than
// rendering blank — a log row is worth showing even if it is a step ahead of
// the UI.

export const ACTION_LABELS = {
  'News.Create': 'Postavio vest',
  'News.Update': 'Izmenio vest',
  'News.Publish': 'Objavio vest',
  'News.Unpublish': 'Ugasio vest',
  'News.Delete': 'Obrisao vest',
  'News.MoveUp': 'Pomerio vest gore',
  'News.MoveDown': 'Pomerio vest dole',
  'News.Notice.Update': 'Izmenio traku „Aktuelno“',

  'Finance.Entry.Create': 'Uneo stavku',
  'Finance.Entry.Update': 'Izmenio stavku',
  'Finance.Entry.Delete': 'Obrisao stavku',

  'Finance.Category.Create': 'Dodao kategoriju',
  'Finance.Category.Update': 'Izmenio kategoriju',
  'Finance.Category.Delete': 'Obrisao kategoriju',
  'Finance.Category.MoveUp': 'Pomerio kategoriju gore',
  'Finance.Category.MoveDown': 'Pomerio kategoriju dole',

  'Finance.Year.Save': 'Sačuvao godinu',
  'Finance.Quarter.SetStatus': 'Promenio status kvartala',

  'Assembly.Session.Create': 'Zakazao sednicu',
  'Assembly.Session.Update': 'Izmenio sednicu',
  'Assembly.Session.Open': 'Otvorio sednicu',
  'Assembly.Session.Close': 'Zatvorio sednicu',
  'Assembly.Session.Cancel': 'Otkazao sednicu',
  'Assembly.Session.Delete': 'Obrisao sednicu',

  'Assembly.Topic.Propose': 'Predložio temu',
  'Assembly.Topic.Update': 'Izmenio temu',
  'Assembly.Topic.Approve': 'Prihvatio temu',
  'Assembly.Topic.Reject': 'Odbio temu',
  'Assembly.Topic.Withdraw': 'Povukao predlog',
  'Assembly.Topic.Assign': 'Premestio temu',
  'Assembly.Topic.Delete': 'Obrisao temu',
  'Assembly.Topic.MoveUp': 'Pomerio tačku gore',
  'Assembly.Topic.MoveDown': 'Pomerio tačku dole',

  'Assembly.Voting.Open': 'Otvorio glasanje',
  'Assembly.Voting.Close': 'Zatvorio glasanje',

  'Assembly.Attendance.Override': 'Ispravio spisak prisutnih',
  'Assembly.Points.Award': 'Upisao poene za sednicu',

  'Petition.Create': 'Napravio peticiju',
  'Petition.Update': 'Izmenio peticiju',
  'Petition.Open': 'Otvorio peticiju za potpisivanje',
  'Petition.Close': 'Zatvorio peticiju',
  'Petition.Delete': 'Obrisao peticiju',
  'Petition.MoveUp': 'Pomerio peticiju gore',
  'Petition.MoveDown': 'Pomerio peticiju dole',
  'Petition.PurgeSignatures': 'Obrisao potpise',
  'Petition.SignaturesExport': 'Izvezao spisak potpisnika',

  'Assembly.Rules.Update': 'Izmenio pravila glasanja',

  'Comment.BanUser': 'Zabranio komentarisanje (10 dana)',
  'Comment.UnbanUser': 'Skinuo zabranu komentarisanja',

  'User.CreateAccount': 'Kreirao nalog',
  'User.CreateModerator': 'Kreirao moderatora',
  'User.ChangeRole': 'Promenio rolu',
  'User.Deactivate': 'Deaktivirao nalog',
  'User.Activate': 'Aktivirao nalog',
};

export const ENTITY_LABELS = {
  News: 'Vest',
  FinanceEntry: 'Finansijska stavka',
  FinanceCategory: 'Kategorija',
  FinanceYear: 'Godina',
  FinanceQuarter: 'Kvartal',
  AssemblySession: 'Sednica skupštine',
  AssemblyTopic: 'Tačka dnevnog reda',
  Petition: 'Peticija',
  User: 'Nalog',
};

// Destructive actions are tinted red so a page of routine edits does not hide
// the one deletion on it.
const DESTRUCTIVE = new Set([
  'News.Delete',
  'News.Unpublish',
  'Finance.Entry.Delete',
  'Finance.Category.Delete',
  'Assembly.Session.Cancel',
  'Assembly.Session.Delete',
  'Assembly.Topic.Reject',
  'Assembly.Topic.Delete',
  'Petition.Delete',
  'Petition.PurgeSignatures',
  // Not destructive, but it is the row an admin most needs to spot: a copy of
  // special-category personal data left the panel.
  'Petition.SignaturesExport',
  'Comment.BanUser',
  'User.Deactivate',
]);

export function actionLabel(action) {
  return ACTION_LABELS[action] || action;
}

export function entityLabel(entityType) {
  return ENTITY_LABELS[entityType] || entityType;
}

export function actionTone(action) {
  return DESTRUCTIVE.has(action) ? 'danger' : 'default';
}
