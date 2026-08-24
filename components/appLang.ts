// ============================================================
//  components/appLang.ts
//
//  Zabon - YAK JOI UMUMI, mislи naql dar appTheme.ts.
//  Kalid ayni hamonest ki Auth istifoda mebarad (tajgram_lang),
//  baroi hamin intikhobi zabon dar hamai sayt yakkhela memonad.
// ============================================================

export type Lang = "tj" | "ru" | "en";

export const LANG_KEY = "tajgram_lang";
export const LANG_EVENT = "tajgram-lang";

export const LANGS: { code: Lang; short: string; label: string }[] = [
  { code: "tj", short: "TJ", label: "Тоҷикӣ" },
  { code: "ru", short: "RU", label: "Русский" },
  { code: "en", short: "EN", label: "English" },
];

export function readLang(): Lang {
  if (typeof localStorage === "undefined") return "tj";
  const saved = localStorage.getItem(LANG_KEY);
  return saved === "ru" || saved === "en" || saved === "tj" ? saved : "tj";
}

export function writeLang(lang: Lang) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(LANG_KEY, lang);
  window.dispatchEvent(new CustomEvent<Lang>(LANG_EVENT, { detail: lang }));
}

export function onLangChange(listener: (lang: Lang) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<Lang>).detail;
    listener(detail === "ru" || detail === "en" ? detail : "tj");
  };
  window.addEventListener(LANG_EVENT, handler);
  return () => window.removeEventListener(LANG_EVENT, handler);
}

// ============================================================
//  Matnho. Namuna - anglisi; tj va ru hamon shaklro dorand.
// ============================================================
const en = {
  navHome: "Home",
  navSearch: "Search",
  navExplore: "Explore",
  navReels: "Reels",
  navMessages: "Messages",
  navNotifications: "Notifications",
  navCreate: "Create",
  navProfile: "Profile",
  navMore: "More",
  navSettings: "Settings",
  navSaved: "Saved",
  navLanguage: "Language",
  themeDark: "Dark theme",
  themeLight: "Light theme",
  logout: "Log out",

  yourStory: "your story",
  noStories: "No new stories in the last 24 hours.",

  caughtUpTitle: "You're all caught up",
  caughtUpText: "You've seen all new posts from the past 3 days.",
  viewOlder: "View older posts",
  suggestedPosts: "Suggested Posts",
  noPostsTitle: "No posts yet",
  noPostsText: "Nothing has been published to this backend yet.",
  createPost: "Create post",
  loading: "Loading...",

  addComment: "Add a comment...",
  send: "Post",
  more: "more",
  viewAllComments: "View all comments",
  likes: "likes",
  like: "like",

  suggestedForYou: "Suggested for you",
  seeAll: "See all",
  followsYou: "Follows you",
  friends: "You follow each other",
  noSuggestions: "No suggestions right now.",
  follow: "Follow",
  following: "Following",

  posts: "posts",
  followers: "followers",
  followingCount: "following",
  editProfile: "Edit profile",
  noUserPosts: "No posts yet.",

  explore: "Explore",
  saved: "Saved",
  noSaved: "Nothing saved yet.",
  notifications: "Notifications",
  noActivity: "No activity yet.",
  settings: "Settings",

  createTitle: "Create post",
  pickFiles: "Choose a photo or video",
  picked: "Files chosen",
  captionTitle: "Title (optional)",
  captionText: "Description",
  publish: "Publish",
  publishing: "Publishing...",
  pickAtLeastOne: "Choose at least one file",
  publishFailed: "Could not publish",

  setPrivate: "Private account",
  setActivity: "Show activity status",
  setComments: "Allow comments",
  setMessages: "Allow messages",
  setTags: "Allow tags",
  setNotifyLikes: "Notify about likes",
  setNotifyComments: "Notify about comments",
  setNotifyFollows: "Notify about follows",
  setNotifyMessages: "Notify about messages",
  setEmail: "Email notifications",
  settingsUnavailable: "Settings unavailable",

  profileUnavailable: "Profile unavailable: the server did not answer.",
  profileNotFound: "Profile not found",
  feedFailed: "Could not load the feed",
  mediaUnavailable: "Media unavailable",
};

export type Dict = typeof en;

const tj: Dict = {
  navHome: "Asosi",
  navSearch: "Justuju",
  navExplore: "Kashf",
  navReels: "Reels",
  navMessages: "Payomho",
  navNotifications: "Bayanho",
  navCreate: "Guzoshtan",
  navProfile: "Profil",
  navMore: "Boz ham",
  navSettings: "Tanzimot",
  navSaved: "Saqlshuda",
  navLanguage: "Zabon",
  themeDark: "Naqli torik",
  themeLight: "Naqli ravshan",
  logout: "Baromadan",

  yourStory: "hikoyai shumo",
  noStories: "Dar 24 soati okhir hikoyai nav nest.",

  caughtUpTitle: "Hamaro didaed",
  caughtUpText: "Hamai posthoi nави 3 rozi okhirro didaed.",
  viewOlder: "Posthoi kuhna",
  suggestedPosts: "Posthoi tavsiyashuda",
  noPostsTitle: "Hanuz post nest",
  noPostsText: "Dar in server hanuz chize nashr nashudaast.",
  createPost: "Post guzoshtan",
  loading: "Boargiri...",

  addComment: "Sharh navised...",
  send: "Firistodan",
  more: "boz",
  viewAllComments: "Hamai sharhho",
  likes: "layk",
  like: "layk",

  suggestedForYou: "Baroi shumo tavsiya",
  seeAll: "Hama",
  followsYou: "Ba shumo obuna ast",
  friends: "Ba hamdigar obuna",
  noSuggestions: "Hozir tavsiya nest.",
  follow: "Obuna",
  following: "Obuna shuda",

  posts: "post",
  followers: "obunachi",
  followingCount: "obunaho",
  editProfile: "Tahriri profil",
  noUserPosts: "Hanuz post nest.",

  explore: "Kashf",
  saved: "Saqlshuda",
  noSaved: "Hanuz chize saql nashudaast.",
  notifications: "Bayanho",
  noActivity: "Hanuz faoliyat nest.",
  settings: "Tanzimot",

  createTitle: "Posti nav",
  pickFiles: "Aks yo video intikhob kuned",
  picked: "Fayl intikhob shud",
  captionTitle: "Sarlavha (ikhtiyori)",
  captionText: "Tavsif",
  publish: "Nashr kardan",
  publishing: "Nashr meshavad...",
  pickAtLeastOne: "Aqalan yak fayl intikhob kuned",
  publishFailed: "Nashr nashud",

  setPrivate: "Profili pushida",
  setActivity: "Nishon dodani faoliyat",
  setComments: "Ijozati sharhho",
  setMessages: "Ijozati payomho",
  setTags: "Ijozati tegho",
  setNotifyLikes: "Bayan dar borai laykho",
  setNotifyComments: "Bayan dar borai sharhho",
  setNotifyFollows: "Bayan dar borai obunaho",
  setNotifyMessages: "Bayan dar borai payomho",
  setEmail: "Bayanho ba email",
  settingsUnavailable: "Tanzimot dastras nest",

  profileUnavailable: "Profil dastras nest: server javob nadod.",
  profileNotFound: "Profil yoft nashud",
  feedFailed: "Lentaro boar kardan nashud",
  mediaUnavailable: "Fayl dastras nest",
};

const ru: Dict = {
  navHome: "Главная",
  navSearch: "Поиск",
  navExplore: "Интересное",
  navReels: "Reels",
  navMessages: "Сообщения",
  navNotifications: "Уведомления",
  navCreate: "Создать",
  navProfile: "Профиль",
  navMore: "Ещё",
  navSettings: "Настройки",
  navSaved: "Сохранённое",
  navLanguage: "Язык",
  themeDark: "Тёмная тема",
  themeLight: "Светлая тема",
  logout: "Выйти",

  yourStory: "ваша история",
  noStories: "За последние 24 часа новых историй нет.",

  caughtUpTitle: "Вы всё посмотрели",
  caughtUpText: "Вы видели все новые публикации за 3 дня.",
  viewOlder: "Показать старые",
  suggestedPosts: "Рекомендации",
  noPostsTitle: "Публикаций пока нет",
  noPostsText: "На этом сервере ещё ничего не опубликовано.",
  createPost: "Создать пост",
  loading: "Загрузка...",

  addComment: "Добавьте комментарий...",
  send: "Отправить",
  more: "ещё",
  viewAllComments: "Все комментарии",
  likes: "отметок «Нравится»",
  like: "отметка «Нравится»",

  suggestedForYou: "Рекомендации для вас",
  seeAll: "Все",
  followsYou: "Подписан на вас",
  friends: "Вы подписаны друг на друга",
  noSuggestions: "Сейчас рекомендаций нет.",
  follow: "Подписаться",
  following: "Вы подписаны",

  posts: "публикаций",
  followers: "подписчиков",
  followingCount: "подписок",
  editProfile: "Редактировать профиль",
  noUserPosts: "Публикаций пока нет.",

  explore: "Интересное",
  saved: "Сохранённое",
  noSaved: "Пока ничего не сохранено.",
  notifications: "Уведомления",
  noActivity: "Активности пока нет.",
  settings: "Настройки",

  createTitle: "Новая публикация",
  pickFiles: "Выберите фото или видео",
  picked: "Файлов выбрано",
  captionTitle: "Заголовок (необязательно)",
  captionText: "Описание",
  publish: "Опубликовать",
  publishing: "Публикуем...",
  pickAtLeastOne: "Выберите хотя бы один файл",
  publishFailed: "Не удалось опубликовать",

  setPrivate: "Закрытый аккаунт",
  setActivity: "Показывать статус активности",
  setComments: "Разрешить комментарии",
  setMessages: "Разрешить сообщения",
  setTags: "Разрешить отметки",
  setNotifyLikes: "Уведомлять о лайках",
  setNotifyComments: "Уведомлять о комментариях",
  setNotifyFollows: "Уведомлять о подписках",
  setNotifyMessages: "Уведомлять о сообщениях",
  setEmail: "Уведомления на email",
  settingsUnavailable: "Настройки недоступны",

  profileUnavailable: "Профиль недоступен: сервер не ответил.",
  profileNotFound: "Профиль не найден",
  feedFailed: "Не удалось загрузить ленту",
  mediaUnavailable: "Файл недоступен",
};

export const dictionary: Record<Lang, Dict> = { tj, ru, en };
