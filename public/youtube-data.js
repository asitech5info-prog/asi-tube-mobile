// AsiTube Data Catalog (Channels, Videos, Comments)
(function() {
  const channels = [
    {
      id: "mrbeast",
      ytChannelId: "UCX6OQ3DkcsbYNE6H8uQQuVA",
      title: "MrBeast",
      avatar: "avatars/mrbeast.jpg",
      subscriberCount: "318M",
      subscribersNumber: 318000000,
      videoCount: 820,
      description: "I want to make the world a better place before I die.",
      subscribed: true
    },
    {
      id: "mkbhd",
      ytChannelId: "UCBJycsmduvYEL83R_U4JriQ",
      title: "Marques Brownlee",
      avatar: "avatars/mkbhd.jpg",
      subscriberCount: "19.1M",
      subscribersNumber: 19100000,
      videoCount: 1650,
      description: "Quality tech videos | YouTuber | Geek | Consumer Electronics",
      subscribed: true
    },
    {
      id: "fireship",
      ytChannelId: "UCsBjURrPoezykLs9EqgamOA",
      title: "Fireship",
      avatar: "avatars/fireship.jpg",
      subscriberCount: "3.2M",
      subscribersNumber: 3200000,
      videoCount: 610,
      description: "High-intensity code tutorials and tech news to help you ship apps faster.",
      subscribed: true
    },
    {
      id: "rockstargames",
      ytChannelId: "UCbW18JZ95AUh3zHg3740tpg",
      title: "Rockstar Games",
      avatar: "avatars/rockstargames.jpg",
      subscriberCount: "11.2M",
      subscribersNumber: 11200000,
      videoCount: 350,
      description: "Official channel for Rockstar Games.",
      subscribed: true
    },
    {
      id: "veritasium",
      ytChannelId: "UCHnyfMqiRRG1u-2MsSQLbXA",
      title: "Veritasium",
      avatar: "avatars/veritasium.jpg",
      subscriberCount: "16.4M",
      subscribersNumber: 16400000,
      videoCount: 390,
      description: "An element of truth - videos about science, education, and anything interesting.",
      subscribed: false
    },
    {
      id: "kurzgesagt",
      ytChannelId: "UCsXVk37bltHxD1rDPwtNM8Q",
      title: "Kurzgesagt – In a Nutshell",
      avatar: "avatars/kurzgesagt.jpg",
      subscriberCount: "22.5M",
      subscribersNumber: 22500000,
      videoCount: 220,
      description: "Videos explaining things with optimistic nihilism. We are a small team who want to make science look beautiful.",
      subscribed: false
    },
    {
      id: "lofigirl",
      ytChannelId: "UCSJ4gkVC6NrvII8umztf0Ow",
      title: "Lofi Girl",
      avatar: "avatars/lofigirl.jpg",
      subscriberCount: "14.3M",
      subscribersNumber: 14300000,
      videoCount: 410,
      description: "Relax, study, work with lofi beats 24/7.",
      subscribed: false
    },
    {
      id: "pewdiepie",
      ytChannelId: "UC-lHJZR3Gqxm24_Vd_AJ5Yw",
      title: "PewDiePie",
      avatar: "avatars/pewdiepie.jpg",
      subscriberCount: "111M",
      subscribersNumber: 111000000,
      videoCount: 4700,
      description: "I make videos on the internet.",
      subscribed: false
    }
  ];

  const initialVideos = [
    {
      id: "_c2e1NcI3Sc",
      title: "Beat Haaland, Win $100,000",
      channelId: "mrbeast",
      channelTitle: "MrBeast",
      channelAvatar: "avatars/mrbeast.jpg",
      subscriberCount: "318M",
      description: "Can you score a penalty against Erling Haaland for $100,000? Watch the world's best challenge!",
      thumbnail: "thumbnails/_c2e1NcI3Sc.jpg",
      views: "48,912,019",
      uploadedAt: "Latest YouTube Upload",
      timestamp: Date.now() - 3600 * 1000,
      duration: "14:22",
      category: "Trending",
      isNew: true,
      likes: "2,410,920",
      tags: ["MrBeast", "Haaland", "Challenge", "Cash"]
    },
    {
      id: "QdBZY2fkU-0",
      title: "Grand Theft Auto VI Trailer 1",
      channelId: "rockstargames",
      channelTitle: "Rockstar Games",
      channelAvatar: "avatars/rockstargames.jpg",
      subscriberCount: "11.2M",
      description: "Grand Theft Auto VI heads to the state of Leonida, home to the neon-soaked streets of Vice City and beyond.",
      thumbnail: "thumbnails/QdBZY2fkU-0.jpg",
      views: "215,482,912",
      uploadedAt: "Recently Uploaded",
      timestamp: Date.now() - 2 * 3600 * 1000,
      duration: "1:31",
      category: "Gaming",
      isNew: true,
      likes: "11,842,109",
      tags: ["GTA6", "Gaming", "Rockstar", "Trailer"]
    },
    {
      id: "ESABTN4VtrA",
      title: "iPhone Duo Review: First Generation Fun!",
      channelId: "mkbhd",
      channelTitle: "Marques Brownlee",
      channelAvatar: "avatars/mkbhd.jpg",
      subscriberCount: "19.1M",
      description: "The iPhone Duo review is finally here. Two screens, all the new tech, and how it holds up in real life.",
      thumbnail: "thumbnails/ESABTN4VtrA.jpg",
      views: "4,821,092",
      uploadedAt: "1 day ago",
      timestamp: Date.now() - 24 * 3600 * 1000,
      duration: "18:45",
      category: "Tech",
      isNew: false,
      likes: "320,109",
      tags: ["iPhone", "Tech", "MKBHD", "Review"]
    },
    {
      id: "ENrzD9HAZK4",
      title: "Node.js in 100 Seconds",
      channelId: "fireship",
      channelTitle: "Fireship",
      channelAvatar: "avatars/fireship.jpg",
      subscriberCount: "3.2M",
      description: "Learn Node.js in 100 seconds! Understand the V8 engine, event loop, libuv, asynchronous I/O and more.",
      thumbnail: "thumbnails/ENrzD9HAZK4.jpg",
      views: "2,981,420",
      uploadedAt: "2 days ago",
      timestamp: Date.now() - 48 * 3600 * 1000,
      duration: "2:29",
      category: "Coding",
      isNew: false,
      likes: "198,400",
      tags: ["Node.js", "JavaScript", "Fireship", "Backend"]
    },
    {
      id: "9bqk6ZUsKyA",
      title: "50 Hours In Solitary Confinement",
      channelId: "mrbeast",
      channelTitle: "MrBeast",
      channelAvatar: "avatars/mrbeast.jpg",
      subscriberCount: "318M",
      description: "I spent 50 hours in an all-white soundproof room with zero human contact. Here's what happened.",
      thumbnail: "thumbnails/9bqk6ZUsKyA.jpg",
      views: "184,209,102",
      uploadedAt: "3 days ago",
      timestamp: Date.now() - 72 * 3600 * 1000,
      duration: "18:20",
      category: "Trending",
      isNew: false,
      likes: "8,920,400",
      tags: ["MrBeast", "Challenge", "50 Hours"]
    },
    {
      id: "Tn6-PIqc4UM",
      title: "React 19 in 100 Seconds",
      channelId: "fireship",
      channelTitle: "Fireship",
      channelAvatar: "avatars/fireship.jpg",
      subscriberCount: "3.2M",
      description: "React 19 is officially here. Let's break down Actions, useActionState, useOptimistic, server components and more.",
      thumbnail: "thumbnails/Tn6-PIqc4UM.jpg",
      views: "1,452,190",
      uploadedAt: "4 days ago",
      timestamp: Date.now() - 96 * 3600 * 1000,
      duration: "2:31",
      category: "Coding",
      isNew: false,
      likes: "112,045",
      tags: ["React", "React19", "JavaScript", "Fireship"]
    },
    {
      id: "pAnGwRiQ4-4",
      title: "$1 vs $1,000,000,000 Futuristic Tech!",
      channelId: "mrbeast",
      channelTitle: "MrBeast",
      channelAvatar: "avatars/mrbeast.jpg",
      subscriberCount: "318M",
      description: "We tried out the craziest futuristic technology on earth ranging from $1 to $1,000,000,000!",
      thumbnail: "thumbnails/pAnGwRiQ4-4.jpg",
      views: "92,109,240",
      uploadedAt: "5 days ago",
      timestamp: Date.now() - 120 * 3600 * 1000,
      duration: "16:40",
      category: "Trending",
      isNew: false,
      likes: "5,410,200",
      tags: ["MrBeast", "Futuristic Tech", "Challenge"]
    },
    {
      id: "g6Die8gVFn0",
      title: "OLED iPad Mini: The Most Apple Product Ever",
      channelId: "mkbhd",
      channelTitle: "Marques Brownlee",
      channelAvatar: "avatars/mkbhd.jpg",
      subscriberCount: "19.1M",
      description: "The new iPad Mini with an OLED display is finally real. Is it the ultimate portable tablet?",
      thumbnail: "thumbnails/g6Die8gVFn0.jpg",
      views: "3,892,104",
      uploadedAt: "6 days ago",
      timestamp: Date.now() - 144 * 3600 * 1000,
      duration: "12:15",
      category: "Tech",
      isNew: false,
      likes: "245,100",
      tags: ["iPad", "Apple", "MKBHD", "Tech"]
    }
  ];

  const sampleComments = {
    "_c2e1NcI3Sc": [
      { id: "c_h1", user: "SoccerFan99", avatar: "avatars/mrbeast.jpg", time: "1 hour ago", text: "Haaland in a MrBeast video is the crossover nobody expected!", likes: "19.5K" },
      { id: "c_h2", user: "CityFanatic", avatar: "avatars/mkbhd.jpg", time: "2 hours ago", text: "That final penalty shot was unreal.", likes: "8.2K" }
    ],
    "QdBZY2fkU-0": [
      { id: "c_g1", user: "ViceCityLover", avatar: "avatars/fireship.jpg", time: "30 mins ago", text: "Vice City graphics are unbelievable. Can't wait!", likes: "42.1K" }
    ]
  };

  const ASI_DATA = { channels, initialVideos, sampleComments };

  if (typeof window !== 'undefined') {
    window.ASI_DATA = ASI_DATA;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ASI_DATA;
  }
})();
