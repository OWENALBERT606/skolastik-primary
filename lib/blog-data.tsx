export interface BlogPost {
  id: string
  title: string
  excerpt: string
  content: string
  author: string
  publishedAt: string
  imageUrl: string
  category: string
  readTime: number
}

export interface Comment {
  id: string
  postId: string
  author: string
  content: string
  createdAt: string
  parentId?: string
}

export const mockBlogPosts: BlogPost[] = [
  {
    id: "1",
    title: "Understanding Electoral Systems: Democracy in Practice",
    excerpt:
      "Explore different electoral systems around the world and how they shape democratic representation and governance.",
    content: `
      <p>Electoral systems are the foundation of democratic governance, determining how votes translate into political representation. Understanding these systems is crucial for informed civic participation.</p>
      
      <h2>First-Past-The-Post vs. Proportional Representation</h2>
      <p>The First-Past-The-Post system, used in countries like the United States and United Kingdom, awards seats to candidates with the most votes in each district. In contrast, proportional representation systems allocate seats based on the percentage of votes each party receives nationwide.</p>
      
      <h2>The Impact on Political Parties</h2>
      <p>Different electoral systems significantly influence party systems. FPTP tends to favor two-party systems, while proportional representation often leads to multi-party coalitions and more diverse political representation.</p>
      
      <h2>Voter Behavior and Strategic Voting</h2>
      <p>Electoral systems also shape how citizens vote. In FPTP systems, voters may engage in strategic voting, choosing not their preferred candidate but the one most likely to defeat their least preferred option.</p>
    `,
    author: "Dr. Patricia Williams",
    publishedAt: "2024-01-15",
    imageUrl: "/modern-web-dev-workspace.png",
    category: "Political Science",
    readTime: 10,
  },
  {
    id: "2",
    title: "The Role of Media in Modern Democracy",
    excerpt:
      "Analyzing how traditional and social media influence political discourse, public opinion, and democratic processes.",
    content: `
      <p>Media plays a pivotal role in shaping democratic discourse, serving as both an information source and a platform for political debate. Understanding media's influence is essential for navigating modern politics.</p>
      
      <h2>Traditional Media vs. Digital Platforms</h2>
      <p>Traditional media outlets like newspapers and television have long served as gatekeepers of information, while social media platforms have democratized content creation but also introduced new challenges around misinformation and echo chambers.</p>
      
      <h2>The Filter Bubble Effect</h2>
      <p>Algorithmic content curation on social media can create filter bubbles, where users are primarily exposed to information that confirms their existing beliefs, potentially polarizing political discourse.</p>
      
      <h2>Media Literacy in the Digital Age</h2>
      <p>Developing critical media literacy skills is crucial for citizens to evaluate sources, identify bias, and distinguish between factual reporting and opinion content in an increasingly complex information landscape.</p>
    `,
    author: "Prof. Michael Rodriguez",
    publishedAt: "2024-01-10",
    imageUrl: "/accessibility-inclusive-design.png",
    category: "Media Studies",
    readTime: 12,
  },
  {
    id: "3",
    title: "Constitutional Law: Separation of Powers Explained",
    excerpt:
      "A comprehensive look at how the separation of powers doctrine works in practice and its importance for democratic governance.",
    content: `
      <p>The separation of powers is a fundamental principle of constitutional democracy, designed to prevent the concentration of power and protect individual rights through a system of checks and balances.</p>
      
      <h2>The Three Branches of Government</h2>
      <p>The legislative branch creates laws, the executive branch enforces them, and the judicial branch interprets them. This division ensures that no single branch becomes too powerful and that each can check the others' authority.</p>
      
      <h2>Checks and Balances in Action</h2>
      <p>Real-world examples include the president's veto power over legislation, Congress's ability to impeach officials, and the Supreme Court's power of judicial review to declare laws unconstitutional.</p>
      
      <h2>Modern Challenges</h2>
      <p>Contemporary issues like executive orders, administrative agencies, and partisan polarization test the traditional boundaries between branches and raise questions about the evolving nature of separated powers.</p>
    `,
    author: "Justice Sarah Thompson",
    publishedAt: "2024-01-05",
    imageUrl: "/react-server-components-architecture.png",
    category: "Constitutional Law",
    readTime: 15,
  },
]

export const mockComments: Comment[] = [
  {
    id: "c1",
    postId: "1",
    author: "Robert Chen",
    content:
      "Excellent analysis! I've always wondered why some countries have so many political parties while others are dominated by just two. The electoral system explanation makes perfect sense.",
    createdAt: "2024-01-16T10:30:00Z",
  },
  {
    id: "c2",
    postId: "1",
    author: "Maria Gonzalez",
    content:
      "Do you think proportional representation would work in the United States? What would be the main challenges to implementing such a system?",
    createdAt: "2024-01-16T14:15:00Z",
  },
  {
    id: "c3",
    postId: "1",
    author: "Dr. Patricia Williams",
    content:
      "Great question! The main challenges would be constitutional amendments and overcoming entrenched two-party interests. However, some states are experimenting with ranked-choice voting as a step in that direction.",
    createdAt: "2024-01-16T16:45:00Z",
    parentId: "c2",
  },
  {
    id: "c4",
    postId: "2",
    author: "Alex Johnson",
    content:
      "The filter bubble concept is so relevant today. I've noticed how my social media feeds have become increasingly homogeneous in terms of political viewpoints.",
    createdAt: "2024-01-11T09:20:00Z",
  },
  {
    id: "c5",
    postId: "3",
    author: "Jennifer Park",
    content:
      "This breakdown of separation of powers is incredibly helpful for understanding current political debates. The checks and balances system is more complex than I realized.",
    createdAt: "2024-01-06T11:30:00Z",
  },
]
