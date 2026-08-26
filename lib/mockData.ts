// ============================================================
//  lib/mockData.ts
//  Маълумотҳои озмоишӣ (Mock Data) барои вақте ки сервер кор намекунад.
// ============================================================

export const MOCK_USER_ID = "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d";
export const MOCK_USER_NAME = "dilovar06";

export const MOCK_MY_PROFILE = {
  userId: MOCK_USER_ID,
  userName: MOCK_USER_NAME,
  fullName: "Диловар Раҳимов",
  email: "dilovar@tajgram.tj",
  about: "Таҳиягари веб 💻 | Tajgram-ро дӯст медорам! 🇹🇯",
  gender: 0, // 0 = male
  image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop",
  postCount: 2,
  subscribersCount: 1420,
  subscriptionsCount: 382,
  isFollowing: false,
};

export const MOCK_UNREAD_COUNT = {
  total: 4,
  like: 2,
  subscribed: 1,
  message: 1,
};

export const MOCK_STORIES = [
  {
    id: 501,
    fileName: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    postId: null,
    createAt: new Date().toISOString(),
    userId: "u101",
    userName: "samir_99",
    userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
    viewerDto: null,
  },
  {
    id: 502,
    fileName: "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=800",
    postId: null,
    createAt: new Date().toISOString(),
    userId: "u102",
    userName: "safina_g",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    viewerDto: null,
  },
  {
    id: 503,
    fileName: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800",
    postId: null,
    createAt: new Date().toISOString(),
    userId: "u103",
    userName: "tojikiston_travel",
    userAvatar: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=150&h=150&fit=crop",
    viewerDto: null,
  },
];

export const MOCK_POSTS = [
  {
    postId: 1,
    title: "Манзараи афсонавии кӯли Искандаркӯл 🏔️💧",
    content: "Имрӯз ба яке аз зеботарин мавзеъҳои Тоҷикистон сафар кардем. Искандаркӯл ҳақиқатан гавҳари кӯҳсори мост. Ҳавои тоза ва манзараи дилкаш!",
    datePublished: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    userId: "u103",
    userName: "tojikiston_travel",
    userImage: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=150&h=150&fit=crop",
    images: [
      { id: 1001, imageName: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800" },
      { id: 1002, imageName: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800" }
    ],
    postLikeCount: 382,
    postViewCount: 1205,
    commentCount: 2,
    postFavoriteCount: 45,
    postLike: true,
    postFavorite: false,
    postView: true,
    comments: [
      {
        commentId: 2001,
        comment: "Манзараи бениҳоят зебо! Офарин барои аксҳо 🇹🇯",
        userId: "u101",
        userName: "samir_99",
        userImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
        dateCommented: new Date(Date.now() - 3600 * 1000).toISOString(),
      },
      {
        commentId: 2002,
        comment: "Ман ҳам ба наздикӣ он ҷо меравам! Хеле олиҷаноб.",
        userId: "u102",
        userName: "safina_g",
        userImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
        dateCommented: new Date(Date.now() - 1800 * 1000).toISOString(),
      }
    ],
  },
  {
    postId: 2,
    title: "Оғози лоиҳаи нави мо — Tajgram! 💻🚀",
    content: "Ниҳоят мо корҳои аввалини платформаи иҷтимоии миллии Tajgram-ро ба итмом расонидем. Дастгирии шумо барои мо хеле муҳим аст! Фикру мулоҳизаҳоятонро нависед.",
    datePublished: new Date(Date.now() - 3600 * 1000 * 8).toISOString(),
    userId: MOCK_USER_ID,
    userName: MOCK_USER_NAME,
    userImage: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop",
    images: [
      { id: 1003, imageName: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800" }
    ],
    postLikeCount: 156,
    postViewCount: 420,
    commentCount: 1,
    postFavoriteCount: 19,
    postLike: false,
    postFavorite: true,
    postView: true,
    comments: [
      {
        commentId: 2003,
        comment: "Ин лоиҳаи беҳтарин барои ҷавонони мо хоҳад буд! Муваффақият!",
        userId: "u104",
        userName: "alisher_dev",
        userImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop",
        dateCommented: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
      }
    ],
  },
  {
    postId: 3,
    title: "Нону чойи субҳонаи тоҷикӣ 🥨☕",
    content: "Ҳеҷ чиз ба нони гарми танӯрӣ ва чойи кабуди субҳонаи мо баробар шуда нематавонад. Субҳи ҳама ба хайр бошад!",
    datePublished: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    userId: "u102",
    userName: "safina_g",
    userImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    images: [
      { id: 1004, imageName: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800" }
    ],
    postLikeCount: 524,
    postViewCount: 2100,
    commentCount: 0,
    postFavoriteCount: 88,
    postLike: false,
    postFavorite: false,
    postView: true,
    comments: [],
  }
];

export const MOCK_REELS = [
  {
    reelsId: 601,
    title: "Шаршараи кӯҳҳои Варзоб 🌊",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-beautiful-waterfall-in-a-forest-42517-large.mp4",
    coverImage: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400",
    likeCount: 928,
    viewCount: 4200,
    commentCount: 14,
    isLiked: false,
    createdAt: new Date().toISOString(),
    userId: "u103",
    userName: "tojikiston_travel",
    userImage: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=150&h=150&fit=crop",
  },
  {
    reelsId: 602,
    title: "Оғози рӯзи нав дар Душанбе 🏙️🌅",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-time-lapse-of-a-city-street-at-night-42218-large.mp4",
    coverImage: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400",
    likeCount: 1420,
    viewCount: 8900,
    commentCount: 32,
    isLiked: true,
    createdAt: new Date().toISOString(),
    userId: "u101",
    userName: "samir_99",
    userImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
  }
];

export const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: "like",
    text: "пости шуморо писанд кард",
    isRead: false,
    createdAt: new Date(Date.now() - 600 * 1000).toISOString(),
    userId: "u101",
    userName: "samir_99",
    fullName: "Самир Иброҳимов",
    userImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
    postId: 2,
    previewImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150",
  },
  {
    id: 2,
    type: "subscribed",
    text: "ба шумо обуна шуд",
    isRead: false,
    createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    userId: "u102",
    userName: "safina_g",
    fullName: "Сафина Гулзод",
    userImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
  }
];

export const MOCK_SETTINGS = {
  isPrivate: false,
  allowComments: true,
  allowTags: true,
};

export const MOCK_BLOCKED_USERS = [];

export const MOCK_CHATS = [
  {
    chatId: 1001,
    userId: "u101",
    userName: "samir_99",
    fullName: "Самир Иброҳимов",
    userImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
    lastMessage: "Салом! Чӣ хел корҳо?",
    lastMessageDate: new Date(Date.now() - 600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3600 * 24 * 5 * 1000).toISOString(),
  },
  {
    chatId: 1002,
    userId: "u102",
    userName: "safina_g",
    fullName: "Сафина Гулзод",
    userImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    lastMessage: "Пагоҳ вомехӯрем?",
    lastMessageDate: new Date(Date.now() - 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3600 * 24 * 10 * 1000).toISOString(),
  }
];

export const MOCK_FOLLOWERS = [
  {
    userId: "u101",
    userName: "samir_99",
    fullName: "Самир Иброҳимов",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
    isFollowing: true,
  },
  {
    userId: "u102",
    userName: "safina_g",
    fullName: "Сафина Гулзод",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    isFollowing: true,
  },
  {
    userId: "u104",
    userName: "alisher_dev",
    fullName: "Алишер Раҳмонов",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop",
    isFollowing: false,
  }
];

export const MOCK_FOLLOWINGS = [
  {
    userId: "u101",
    userName: "samir_99",
    fullName: "Самир Иброҳимов",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
    isFollowing: true,
  },
  {
    userId: "u102",
    userName: "safina_g",
    fullName: "Сафина Гулзод",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    isFollowing: true,
  },
  {
    userId: "u103",
    userName: "tojikiston_travel",
    fullName: "Сайёҳони Тоҷикистон",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=150&h=150&fit=crop",
    isFollowing: true,
  }
];

// Message storage
export const INITIAL_MOCK_MESSAGES = [
  {
    messageId: 20001,
    chatId: 1001,
    userId: "u101",
    userName: "samir_99",
    messageText: "Салом! Лоиҳаи Tajgram чӣ хел рафта истодааст?",
    fileName: null,
    dateSent: new Date(Date.now() - 1200 * 1000).toISOString(),
    isMine: false,
  },
  {
    messageId: 20002,
    chatId: 1001,
    userId: MOCK_USER_ID,
    userName: MOCK_USER_NAME,
    messageText: "Салом! Бале, ҳамааш олӣ. Кор карда истодаем ва бисёр қисмҳо тайёранд.",
    fileName: null,
    dateSent: new Date(Date.now() - 900 * 1000).toISOString(),
    isMine: true,
  },
  {
    messageId: 20003,
    chatId: 1001,
    userId: "u101",
    userName: "samir_99",
    messageText: "Салом! Чӣ хел корҳо?",
    fileName: null,
    dateSent: new Date(Date.now() - 600 * 1000).toISOString(),
    isMine: false,
  },
  {
    messageId: 20004,
    chatId: 1002,
    userId: "u102",
    userName: "safina_g",
    messageText: "Салом Диловар! Мо пагоҳ барои муҳокимаи лоиҳа вомехӯрем?",
    fileName: null,
    dateSent: new Date(Date.now() - 3600 * 1000).toISOString(),
    isMine: false,
  }
];
