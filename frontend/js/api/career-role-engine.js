/**
 * CAREER INTELLIGENCE ROLE ENGINE
 * Dynamically produces role-specific skill gaps, phased learning roadmaps,
 * verified courses with official working links, and project milestones for ANY role.
 */

export function getCompanyIntelligence(companyName = "General") {
  const comp = (companyName || "General").trim().toLowerCase();

  if (comp.includes("google")) {
    return {
      companyName: "Google",
      hiringPhilosophy: "Google ATS prioritizes high algorithmic complexity, distributed scale, test-driven development (TDD), and sub-millisecond latency measurements.",
      strictnessWeight: 1.20,
      targetMetricTypes: ["latency", "qps", "scale", "dsa", "complexity", "concurrency"],
      requiredKeywords: ["Data Structures", "Algorithms", "Distributed Systems", "Big-O Optimization", "Concurrency", "gRPC", "Unit Testing", "System Design", "Microservices", "Latency Optimization"],
      coreTechnologies: ["C++", "Java", "Go", "Python", "Kubernetes", "Linux", "Protocol Buffers", "SQL"],
      keyDifferentiators: "Heavy emphasis on Big-O computational complexity, distributed concurrency, and 90%+ automated test suites.",
      recommendedAction: "Highlight Big-O improvements, multi-threading/concurrency, and quantifiable latency/throughput metrics in your bullets."
    };
  }

  if (comp.includes("amazon") || comp.includes("aws")) {
    return {
      companyName: "Amazon",
      hiringPhilosophy: "Amazon ATS heavily weights hands-on AWS cloud architecture, decoupled microservices, high availability (99.99%), and customer impact metrics.",
      strictnessWeight: 1.15,
      targetMetricTypes: ["availability", "cost", "users", "scale", "cloud", "throughput"],
      requiredKeywords: ["AWS", "Microservices", "High Availability", "DynamoDB", "Lambda", "Event-Driven", "CI/CD", "Scalability", "Customer Obsession", "REST APIs"],
      coreTechnologies: ["AWS Cloud", "Java", "Python", "TypeScript", "Node.js", "Docker", "NoSQL", "PostgreSQL"],
      keyDifferentiators: "Heavy emphasis on AWS serverless & cloud services, decoupled microservices, cost optimization, and high availability.",
      recommendedAction: "Emphasize AWS cloud services, high availability architectures, and cost/scale metrics."
    };
  }

  if (comp.includes("microsoft") || comp.includes("azure")) {
    return {
      companyName: "Microsoft",
      hiringPhilosophy: "Microsoft ATS seeks robust enterprise-grade architectures, type safety (TypeScript/C#), Azure ecosystem depth, and rigorous automated testing.",
      strictnessWeight: 1.10,
      targetMetricTypes: ["coverage", "enterprise", "reliability", "build_time", "users"],
      requiredKeywords: ["Azure", "TypeScript", ".NET", "C#", "Enterprise Architecture", "Clean Code", "Design Patterns", "Automated Testing", "Security & Compliance", "RESTful Services"],
      coreTechnologies: ["TypeScript", "C#", ".NET Core", "Azure DevOps", "CosmosDB", "React", "SQL Server"],
      keyDifferentiators: "Heavy emphasis on type safety, Azure cloud ecosystem, maintainability, enterprise patterns, and test coverage.",
      recommendedAction: "Highlight TypeScript, C#/.NET or Azure services, code maintainability, and enterprise testing standards."
    };
  }

  if (comp.includes("meta") || comp.includes("facebook")) {
    return {
      companyName: "Meta",
      hiringPhilosophy: "Meta ATS prioritizes deep React ecosystem mastery, client-side rendering speed (<100ms), web vitals (LCP/CLS), and high shipping velocity.",
      strictnessWeight: 1.15,
      targetMetricTypes: ["bundle_size", "render_time", "engagement", "web_vitals", "users"],
      requiredKeywords: ["React", "GraphQL", "Frontend Performance", "Web Vitals", "State Management", "Component Architecture", "Rapid Prototyping", "A/B Testing", "Mobile Web", "REST/GraphQL"],
      coreTechnologies: ["React", "JavaScript (ES6+)", "TypeScript", "GraphQL", "Node.js", "Next.js", "CSS3/Tailwind", "PyTorch"],
      keyDifferentiators: "Heavy emphasis on frontend performance, React state architectures, GraphQL APIs, and sub-100ms UI responsiveness.",
      recommendedAction: "Showcase React/GraphQL implementations, bundle size reductions, and fast rendering metrics."
    };
  }

  if (comp.includes("apple")) {
    return {
      companyName: "Apple",
      hiringPhilosophy: "Apple ATS evaluates pixel-perfect UI fidelity, strict user privacy, low memory footprint, and low-level performance optimization.",
      strictnessWeight: 1.20,
      targetMetricTypes: ["fps", "memory", "crash_rate", "battery", "launch_speed"],
      requiredKeywords: ["Swift", "UI/UX Precision", "Memory Management", "On-Device Privacy", "Security & Encryption", "Concurrency", "Performance Tuning", "ARC", "Clean Architecture"],
      coreTechnologies: ["Swift", "SwiftUI", "Objective-C", "C++", "Python", "CoreData", "Metal", "Git"],
      keyDifferentiators: "Heavy emphasis on Swift/Apple ecosystem, memory safety, UI fluidity (60/120 FPS), and privacy standards.",
      recommendedAction: "Highlight Swift/Native capabilities, memory optimizations, UI responsiveness, and security best practices."
    };
  }

  if (comp.includes("tcs") || comp.includes("tata")) {
    return {
      companyName: "TCS",
      hiringPhilosophy: "TCS ATS prioritizes robust full-stack Java/Spring foundations, enterprise SQL schema design, end-to-end SDLC delivery, and client deliverables.",
      strictnessWeight: 0.95,
      targetMetricTypes: ["sprint", "defects", "delivery", "coverage", "database"],
      requiredKeywords: ["Java", "Spring Boot", "Relational Database / SQL", "Microservices", "REST APIs", "Agile / Scrum", "JUnit / Testing", "CI/CD Pipeline", "SDLC Methodology"],
      coreTechnologies: ["Java", "Spring Boot", "Oracle / MySQL", "Hibernate", "Angular/React", "Maven/Gradle", "Jenkins", "Git"],
      keyDifferentiators: "Heavy emphasis on enterprise Java, Spring Boot, SQL databases, Agile delivery cycles, and unit test automation.",
      recommendedAction: "Demonstrate enterprise backend APIs, SQL optimization, Spring Boot services, and SDLC methodology."
    };
  }

  if (comp.includes("infosys")) {
    return {
      companyName: "Infosys",
      hiringPhilosophy: "Infosys ATS looks for modular object-oriented development, RESTful web services, database optimization, and team-based Agile workflows.",
      strictnessWeight: 0.95,
      targetMetricTypes: ["sla", "uptime", "coverage", "turnaround", "delivery"],
      requiredKeywords: ["Core Java", "Python", "Spring Framework", "Microservices Architecture", "Database Normalization", "Web Services", "Cloud Fundamentals", "ITIL / Agile", "Unit Testing"],
      coreTechnologies: ["Java", "Python", "Spring", "PostgreSQL/MySQL", "React/Angular", "Docker", "REST", "Git"],
      keyDifferentiators: "Emphasis on core OOP, Python/Java services, SQL database normalization, and structured software lifecycle.",
      recommendedAction: "Highlight clean OOP design, RESTful web services, database schema design, and team collaboration."
    };
  }

  if (comp.includes("wipro")) {
    return {
      companyName: "Wipro",
      hiringPhilosophy: "Wipro ATS evaluates full-stack proficiency, automated testing integration, cloud basics, and cross-functional client support.",
      strictnessWeight: 0.90,
      targetMetricTypes: ["automation", "sprint", "availability", "defects"],
      requiredKeywords: ["Full Stack Development", "Cloud Migration", "QA Automation", "Web Services", "Database Management", "DevOps Pipelines", "Python/Java", "Agile Delivery"],
      coreTechnologies: ["Java", "Python", "JavaScript", "SQL", "Selenium/Cypress", "AWS/Azure Basics", "Git"],
      keyDifferentiators: "Emphasis on full stack engineering, test automation, cloud migration, and agile team delivery.",
      recommendedAction: "Feature full stack projects, automated test integration, and database management."
    };
  }

  if (comp.includes("startup")) {
    return {
      companyName: "Early-Stage Startup",
      hiringPhilosophy: "Early-stage startups prioritize end-to-end product ownership, shipping speed, modern JavaScript stacks, and autonomous execution.",
      strictnessWeight: 0.95,
      targetMetricTypes: ["mvp_speed", "growth", "users", "ownership", "turnaround"],
      requiredKeywords: ["Full Stack Ownership", "Rapid MVP Delivery", "Next.js", "Node.js", "Firebase / Supabase", "API Integrations", "Autonomous Problem Solving", "Modern UI", "Growth Hacking"],
      coreTechnologies: ["JavaScript", "TypeScript", "React / Next.js", "Node.js", "Tailwind CSS", "Firebase/Supabase", "Stripe API", "Docker"],
      keyDifferentiators: "Heavy emphasis on shipping full-stack features independently, modern React/Next.js stacks, and fast product turnaround.",
      recommendedAction: "Emphasize full stack ownership, rapid MVP delivery timelines (e.g. built in 2 weeks), and user growth."
    };
  }

  // Default / General Tech Industry Benchmark
  return {
    companyName: "General Tech Benchmark",
    hiringPhilosophy: "General industry benchmark balancing foundational coding, standard version control, database design, and structured communication.",
    strictnessWeight: 1.0,
    targetMetricTypes: ["metrics", "percentages", "users", "scale"],
    requiredKeywords: ["Software Development", "Problem Solving", "Version Control (Git)", "REST APIs", "Database Design", "Clean Code", "Debugging", "Testing"],
    coreTechnologies: ["JavaScript", "Python", "SQL", "HTML/CSS", "Git", "Docker", "Node.js"],
    keyDifferentiators: "Balanced evaluation across coding fundamentals, clean code, Git practices, and measurable project impact.",
    recommendedAction: "Ensure clean structure, verified skills, and Google XYZ impact metrics throughout your experience."
  };
}

export function getRoleIntelligence(roleName, targetCompany = "Google") {
  const res = _computeRawRoleIntelligence(roleName, targetCompany) || {};
  
  // Guarantee all array fields exist and attach convenience string arrays
  res.matchedSkills = Array.isArray(res.matchedSkills) ? res.matchedSkills : [];
  res.skillGaps = Array.isArray(res.skillGaps) ? res.skillGaps : [];
  res.courses = Array.isArray(res.courses) ? res.courses : [];
  res.projects = Array.isArray(res.projects) ? res.projects : [];
  res.phases = Array.isArray(res.phases) ? res.phases : [];
  res.roadmapPhases = res.phases;
  res.jobPrep = Array.isArray(res.jobPrep) ? res.jobPrep : [];

  res.currentSkills = res.matchedSkills.map(m => (typeof m === "string" ? m : (m?.skill || "Core Skill")));
  res.skillsToLearn = res.skillGaps.map(g => (typeof g === "string" ? g : (g?.skill || "Advanced Skill")));

  return res;
}

function _computeRawRoleIntelligence(roleName, targetCompany = "Google") {
  const role = (roleName || "Web Developer").trim();
  const lower = role.toLowerCase();
  const company = targetCompany || "Tech Industry";

  // 1. Software Developer / Software Engineer / Core SWE
  if (lower === "software developer" || lower === "software engineer" || lower === "software" || lower.includes("software dev") || lower.includes("software eng") || lower.includes("swe")) {
    return {
      roleTitle: role,
      marketDemand: "Extremely High",
      avgSalary: "$95,000 - $145,000",
      summary: `Tailored intelligence for ${role}. Modern software engineering demands mastery of Data Structures & Algorithms, Object-Oriented & Functional Design, RESTful & RPC APIs, Relational/NoSQL Databases, Clean Architecture, and Automated CI/CD Testing.`,
      matchedSkills: [
        { skill: "Core Programming & Syntax", currentLevel: "Intermediate", strengthAssessment: "Understanding of variables, control flow, functions, and standard libraries." },
        { skill: "Data Structures Fundamentals", currentLevel: "Intermediate", strengthAssessment: "Arrays, hash maps, lists, stacks, and queues." },
        { skill: "Git & Version Control", currentLevel: "Intermediate", strengthAssessment: "Branching, committing, merge conflict resolution, and code reviews." },
        { skill: "Debugging & Problem Solving", currentLevel: "Intermediate", strengthAssessment: "Methodical approach to root-cause analysis and edge cases." }
      ],
      skillGaps: [
        {
          skill: "Advanced Data Structures & Algorithmic Complexity",
          category: "Computer Science",
          currentLevel: "Beginner",
          requiredLevel: "Advanced",
          priority: "Critical",
          gapDescription: "Big-O runtime optimization, trees, graphs, dynamic programming, and search/sort algorithms.",
          actionPlan: "Solve 50 curated LeetCode/NeetCode problems focusing on two-pointers, sliding window, and graph BFS/DFS.",
          estimatedTimeToBridge: "3-4 weeks"
        },
        {
          skill: "System Design & Architecture Patterns",
          category: "System Design",
          currentLevel: "Missing",
          requiredLevel: "Intermediate",
          priority: "Critical",
          gapDescription: "Designing scalable, decoupled architectures (layered, event-driven, microservices, and database indexing).",
          actionPlan: "Study the System Design Primer and design 3 end-to-end architectures (URL shortener, rate limiter, chat backend).",
          estimatedTimeToBridge: "3 weeks"
        },
        {
          skill: "Relational & Document Database Engineering",
          category: "Databases",
          currentLevel: "Beginner",
          requiredLevel: "Advanced",
          priority: "High",
          gapDescription: "Complex SQL queries, ACID transactions, schema normalization, and Redis in-memory caching.",
          actionPlan: "Design schemas in PostgreSQL with indexes, foreign keys, and write raw SQL migrations.",
          estimatedTimeToBridge: "2 weeks"
        },
        {
          skill: "Unit & Integration Testing (TDD)",
          category: "Quality",
          currentLevel: "Beginner",
          requiredLevel: "Advanced",
          priority: "High",
          gapDescription: "Writing automated test suites, mocking external dependencies, and maintaining 80%+ test coverage.",
          actionPlan: "Implement automated test suites using Jest/PyTest/JUnit with mock database connections.",
          estimatedTimeToBridge: "2 weeks"
        }
      ],
      courses: [
        {
          title: "CS50: Introduction to Computer Science",
          platform: "Harvard University & edX Official",
          hours: "35 hrs",
          cert: "CS50 Verified Certificate",
          url: "https://cs50.harvard.edu/x/"
        },
        {
          title: "System Design Primer & Scalable Architecture",
          platform: "GitHub Open Source Community",
          hours: "20 hrs",
          cert: "System Design Architecture Certified",
          url: "https://github.com/donnemartin/system-design-primer"
        },
        {
          title: "The Missing Semester of Your CS Education",
          platform: "MIT Official",
          hours: "15 hrs",
          cert: "MIT Computing Tooling Specialist",
          url: "https://missing.csail.mit.edu/"
        },
        {
          title: "Full Stack Software Engineering & API Curriculum",
          platform: "freeCodeCamp Official",
          hours: "30 hrs",
          cert: "Full Stack Developer Certified",
          url: "https://www.freecodecamp.org/learn/"
        }
      ],
      projects: [
        {
          title: "Distributed Task Queue & Background Job Processing Service",
          desc: "Engineered a decoupled task worker system with Redis message broker, worker retry logic, and real-time status monitoring."
        },
        {
          title: "High-Throughput RESTful API with PostgreSQL & Redis Caching",
          desc: "Architected a secure API gateway with rate-limiting, JWT authentication, database connection pooling, and sub-50ms latency."
        },
        {
          title: "Collaborative Real-Time State Synchronization Engine",
          desc: "Built a multi-client synchronization server using WebSockets, operational transformation, and automated integration test coverage."
        }
      ],
      phases: [
        {
          phaseNumber: 1,
          timeframe: "Weeks 1-3",
          title: "Computer Science Foundations & Algorithmic Thinking",
          focusArea: "Time/Space Complexity, Data Structures & Pointers",
          keyObjectives: ["Master memory management, Big-O notation, and hash structures", "Solve 25 classic algorithmic challenges"],
          suggestedProjects: ["Custom memory-efficient cache library with LRU eviction policy"],
          recommendedCourses: [
            { title: "CS50 Computer Science", platform: "Harvard / edX", hours: "35 hrs", url: "https://cs50.harvard.edu/x/" }
          ]
        },
        {
          phaseNumber: 2,
          timeframe: "Weeks 4-6",
          title: "Clean Code, Database Design & API Architecture",
          focusArea: "REST APIs, PostgreSQL Schema Modeling & ORMs",
          keyObjectives: ["Design normalized relational database schemas with indexing", "Build modular RESTful API endpoints with authentication"],
          suggestedProjects: ["Production-ready API service with automated migrations and auth"],
          recommendedCourses: [
            { title: "Full Stack & API Curriculum", platform: "freeCodeCamp", hours: "30 hrs", url: "https://www.freecodecamp.org/learn/" }
          ]
        },
        {
          phaseNumber: 3,
          timeframe: "Weeks 7-9",
          title: "System Design, Caching & Distributed Workflows",
          focusArea: "Redis Caching, Message Queues & Microservices",
          keyObjectives: ["Implement caching layers to eliminate database bottlenecks", "Decouple long-running workflows with message queues"],
          suggestedProjects: ["Distributed async job processing service with metrics dashboard"],
          recommendedCourses: [
            { title: "System Design Primer", platform: "GitHub Community", hours: "20 hrs", url: "https://github.com/donnemartin/system-design-primer" }
          ]
        },
        {
          phaseNumber: 4,
          timeframe: "Weeks 10-12",
          title: "Automated Testing, CI/CD & Production Capstone",
          focusArea: "Unit/Integration Testing, GitHub Actions & Deployment",
          keyObjectives: ["Achieve 85%+ test coverage across core business logic", "Deploy with automated continuous delivery to cloud"],
          suggestedProjects: ["Flagship production software platform deployed with full documentation"],
          recommendedCourses: [
            { title: "The Missing Semester of CS", platform: "MIT", hours: "15 hrs", url: "https://missing.csail.mit.edu/" }
          ]
        }
      ],
      jobPrep: [
        `Master Big-O time and space complexity analysis for all common data structures.`,
        `Practice live coding technical interviews on LeetCode (Arrays, Two Pointers, Trees, HashMaps).`,
        `Prepare 3 deep-dive architectural stories describing how you solved concurrency, caching, and database bottlenecks.`,
        `Be ready to write clean, modular, object-oriented or functional code with automated unit tests under timed interview pressure.`
      ]
    };
  }

  // 2. Web Developer / Frontend Developer
  if (lower.includes("web") || lower.includes("frontend") || lower.includes("front end") || lower.includes("front-end")) {
    return {
      roleTitle: role,
      marketDemand: "Extremely High",
      avgSalary: "$85,000 - $130,000",
      summary: `Tailored intelligence for ${role}. Modern web development requires proficiency in responsive UI design, modern JavaScript/TypeScript, frontend frameworks (React/Next.js), REST/GraphQL APIs, and web performance optimization.`,
      matchedSkills: [
        { skill: "HTML5 & Semantic Markup", currentLevel: "Intermediate", strengthAssessment: "Understanding of clean document structure, forms, and accessibility primitives." },
        { skill: "CSS3, Flexbox & Grid", currentLevel: "Intermediate", strengthAssessment: "Ability to construct responsive, mobile-first visual layouts." },
        { skill: "JavaScript Fundamentals (ES6+)", currentLevel: "Intermediate", strengthAssessment: "Asynchronous syntax (async/await), DOM events, and array methods." },
        { skill: "Git & Version Control", currentLevel: "Intermediate", strengthAssessment: "Branching, committing, and collaborative pull request workflows." }
      ],
      skillGaps: [
        {
          skill: "Modern JavaScript / TypeScript Deep Dive",
          category: "Frontend",
          currentLevel: "Beginner",
          requiredLevel: "Advanced",
          priority: "Critical",
          gapDescription: "TypeScript is now industry-standard for robust, type-safe web applications.",
          actionPlan: "Learn TypeScript interfaces, generics, union types, and configure tsconfig for modern projects.",
          estimatedTimeToBridge: "2-3 weeks"
        },
        {
          skill: "React & Component Architecture",
          category: "Frameworks",
          currentLevel: "Beginner",
          requiredLevel: "Advanced",
          priority: "Critical",
          gapDescription: "Building scalable single-page apps (SPAs), state management, and hook patterns.",
          actionPlan: "Master useEffect, useMemo, custom hooks, and state libraries like Zustand or Redux Toolkit.",
          estimatedTimeToBridge: "3 weeks"
        },
        {
          skill: "Web Performance, Core Web Vitals & a11y",
          category: "Performance",
          currentLevel: "Missing",
          requiredLevel: "Intermediate",
          priority: "High",
          gapDescription: "Optimizing Largest Contentful Paint (LCP), Cumulative Layout Shift (CLS), and WCAG accessibility standards.",
          actionPlan: "Use Chrome DevTools Lighthouse to audit performance, optimize image loading, and implement ARIA labels.",
          estimatedTimeToBridge: "2 weeks"
        },
        {
          skill: "Automated Frontend Testing (Vitest & Cypress)",
          category: "Testing",
          currentLevel: "Beginner",
          requiredLevel: "Intermediate",
          priority: "High",
          gapDescription: "Writing unit tests for UI components and automated end-to-end browser flows.",
          actionPlan: "Write component tests using React Testing Library and end-to-end tests with Cypress or Playwright.",
          estimatedTimeToBridge: "2 weeks"
        }
      ],
      courses: [
        {
          title: "Responsive Web Design & HTML5/CSS3 Mastery",
          platform: "freeCodeCamp Official",
          hours: "20 hrs",
          cert: "Responsive Web Design Certification",
          url: "https://www.freecodecamp.org/learn/2022/responsive-web-design/"
        },
        {
          title: "JavaScript & Modern TypeScript In-Depth",
          platform: "JavaScript.info & TypeScript Lang",
          hours: "25 hrs",
          cert: "Modern JS & TS Specialist",
          url: "https://javascript.info/"
        },
        {
          title: "React Official Docs & Interactive Tutorial",
          platform: "React.dev Official",
          hours: "18 hrs",
          cert: "React Core Architecture",
          url: "https://react.dev/learn"
        },
        {
          title: "Web.dev: Learn Performance, Accessibility & SEO",
          platform: "Google Web.dev",
          hours: "15 hrs",
          cert: "Web Vitals & Performance Certified",
          url: "https://web.dev/learn/"
        }
      ],
      projects: [
        {
          title: "Interactive SaaS Analytics & Web Dashboard",
          desc: "Build a responsive web dashboard with dark/light mode toggle, dynamic chart visualizations, and API data filtering."
        },
        {
          title: "Modern E-Commerce Storefront with Cart & Stripe",
          desc: "Full-featured web application with product search, filtering, client-side state management, and checkout simulation."
        },
        {
          title: "Collaborative Real-Time Workspace / Kanban Board",
          desc: "Drag-and-drop task management web app with persistent state, real-time sync, and accessibility compliance."
        }
      ],
      phases: [
        {
          phaseNumber: 1,
          timeframe: "Weeks 1-3",
          title: "Web Foundations & Responsive Layouts",
          focusArea: "Semantic HTML5, Advanced CSS3, Flexbox & Grid",
          keyObjectives: ["Build mobile-first responsive interfaces", "Master CSS variables, animations, and typography"],
          suggestedProjects: ["Pixel-perfect landing page with responsive navigation and dark mode toggle"],
          recommendedCourses: [
            { title: "Responsive Web Design Certification", platform: "freeCodeCamp", hours: "20 hrs", url: "https://www.freecodecamp.org/learn/2022/responsive-web-design/" }
          ]
        },
        {
          phaseNumber: 2,
          timeframe: "Weeks 4-6",
          title: "Modern JavaScript (ES6+) & TypeScript",
          focusArea: "Async Programming, DOM Manipulation, and Type Systems",
          keyObjectives: ["Master async/await, closures, prototypes, and fetch APIs", "Add strict static typing with TypeScript"],
          suggestedProjects: ["Type-safe REST API consumer with debounced live search and caching"],
          recommendedCourses: [
            { title: "Modern JavaScript Deep Dive", platform: "JavaScript.info", hours: "25 hrs", url: "https://javascript.info/" }
          ]
        },
        {
          phaseNumber: 3,
          timeframe: "Weeks 7-9",
          title: "React & Component Architecture",
          focusArea: "SPAs, Custom Hooks, State Management & Routing",
          keyObjectives: ["Build scalable component hierarchies", "Manage global state using modern reactive stores"],
          suggestedProjects: ["E-Commerce web storefront with cart state and responsive design"],
          recommendedCourses: [
            { title: "Official React Interactive Course", platform: "React.dev", hours: "18 hrs", url: "https://react.dev/learn" }
          ]
        },
        {
          phaseNumber: 4,
          timeframe: "Weeks 10-12",
          title: "Web Performance, Automated Testing & Deployment",
          focusArea: "Lighthouse Optimization, Unit Testing & CI/CD",
          keyObjectives: ["Achieve 95+ score on Core Web Vitals", "Deploy with automated GitHub Actions workflow"],
          suggestedProjects: ["Flagship portfolio web application deployed with automated CI/CD"],
          recommendedCourses: [
            { title: "Web Performance & Core Web Vitals", platform: "Google Web.dev", hours: "15 hrs", url: "https://web.dev/learn/" }
          ]
        }
      ],
      jobPrep: [
        `Master JavaScript execution context, event loop, hoisting, closures, and promises.`,
        `Practice building responsive UI components from scratch on CodePen / CodeSandbox under time constraints.`,
        `Prepare 3 case studies explaining how you optimized web performance and solved layout challenges.`,
        `Familiarize yourself with frontend screening questions (DOM manipulation, debouncing/throttling, CSS specificity).`
      ]
    };
  }

  // 3. Backend Developer / API Engineer
  if (lower.includes("backend") || lower.includes("back end") || lower.includes("back-end")) {
    return {
      roleTitle: role,
      marketDemand: "Very High",
      avgSalary: "$95,000 - $140,000",
      summary: `Tailored intelligence for ${role}. Backend engineers build robust server-side systems, RESTful and GraphQL APIs, handle high-throughput databases (PostgreSQL/MongoDB), caching layers (Redis), and secure authentication architectures.`,
      matchedSkills: [
        { skill: "Server-Side Programming (Node/Python/Java)", currentLevel: "Intermediate", strengthAssessment: "Writing clean endpoints, asynchronous event loops, and middleware." },
        { skill: "HTTP & REST Standards", currentLevel: "Intermediate", strengthAssessment: "Understanding status codes, headers, request methods, and JSON formatting." },
        { skill: "Basic SQL & NoSQL", currentLevel: "Intermediate", strengthAssessment: "Database CRUD operations and table indexing concepts." }
      ],
      skillGaps: [
        {
          skill: "Relational Database Modeling & PostgreSQL Mastery",
          category: "Databases",
          currentLevel: "Beginner",
          requiredLevel: "Advanced",
          priority: "Critical",
          gapDescription: "Complex joins, indexing strategies, transactions, and migration management.",
          actionPlan: "Build complex relational schemas with foreign keys, compound indexes, and ACID transactions.",
          estimatedTimeToBridge: "2-3 weeks"
        },
        {
          skill: "Authentication, JWT & OAuth2 Security",
          category: "Security",
          currentLevel: "Beginner",
          requiredLevel: "Advanced",
          priority: "Critical",
          gapDescription: "Secure token management, refresh token rotation, password hashing (bcrypt), and RBAC permissions.",
          actionPlan: "Implement custom OAuth2 and JWT authentication servers with rate limiting and secure HTTP-only cookies.",
          estimatedTimeToBridge: "2 weeks"
        },
        {
          skill: "Caching & In-Memory Stores (Redis)",
          category: "Performance",
          currentLevel: "Missing",
          requiredLevel: "Intermediate",
          priority: "High",
          gapDescription: "Cache invalidation strategies, pub/sub messaging, and distributed locking.",
          actionPlan: "Integrate Redis caching to reduce database read load and latency by 80%.",
          estimatedTimeToBridge: "2 weeks"
        },
        {
          skill: "Microservice Architecture & Docker",
          category: "Architecture",
          currentLevel: "Beginner",
          requiredLevel: "Intermediate",
          priority: "High",
          gapDescription: "Containerizing backend services, inter-service communication, and Docker Compose.",
          actionPlan: "Containerize multi-service backend with automated health checks.",
          estimatedTimeToBridge: "2 weeks"
        }
      ],
      courses: [
        {
          title: "Back End Development and APIs Certification",
          platform: "freeCodeCamp Official",
          hours: "25 hrs",
          cert: "Back End API Developer Certified",
          url: "https://www.freecodecamp.org/learn/back-end-development-and-apis/"
        },
        {
          title: "Relational Database & PostgreSQL Certification",
          platform: "freeCodeCamp Official",
          hours: "22 hrs",
          cert: "PostgreSQL & Database Specialist",
          url: "https://www.freecodecamp.org/learn/relational-database/"
        },
        {
          title: "GraphQL Official Architecture & Learning Course",
          platform: "GraphQL.org Official",
          hours: "15 hrs",
          cert: "GraphQL API Specialist",
          url: "https://graphql.org/learn/"
        },
        {
          title: "Redis University: In-Memory Caching & Data Structures",
          platform: "Redis University Official",
          hours: "18 hrs",
          cert: "Redis Certified Developer",
          url: "https://university.redis.com/"
        }
      ],
      projects: [
        {
          title: "High-Concurrency E-Commerce REST & GraphQL API",
          desc: "Engineered scalable backend with inventory locks, Stripe webhooks, Redis caching, and PostgreSQL migrations."
        },
        {
          title: "Real-Time Chat & Notification Gateway (WebSockets & Redis Pub/Sub)",
          desc: "Multi-room messaging service with distributed socket connections, read receipts, and message persistence."
        },
        {
          title: "OAuth2 & Role-Based Access Control (RBAC) Auth Server",
          desc: "Secure microservice handling JWT rotation, MFA verification, rate limiting, and audit logging."
        }
      ],
      phases: [
        {
          phaseNumber: 1,
          timeframe: "Weeks 1-3",
          title: "Backend Core, REST APIs & SQL Modeling",
          focusArea: "Server Runtimes, Routing, Middleware & PostgreSQL",
          keyObjectives: ["Build modular RESTful API controllers with validation", "Design normalized database tables with indexing"],
          suggestedProjects: ["Clean REST API with complete CRUD, pagination, and error handling"],
          recommendedCourses: [
            { title: "Back End Development & APIs", platform: "freeCodeCamp", hours: "25 hrs", url: "https://www.freecodecamp.org/learn/back-end-development-and-apis/" }
          ]
        },
        {
          phaseNumber: 2,
          timeframe: "Weeks 4-6",
          title: "Authentication, Security & Caching (Redis)",
          focusArea: "JWT, Refresh Tokens, bcrypt & Redis Caching",
          keyObjectives: ["Implement secure token rotation and password policies", "Cache high-traffic query results in Redis"],
          suggestedProjects: ["Secure authentication server with rate-limiting and session store"],
          recommendedCourses: [
            { title: "Relational Database Mastery", platform: "freeCodeCamp", hours: "22 hrs", url: "https://www.freecodecamp.org/learn/relational-database/" }
          ]
        },
        {
          phaseNumber: 3,
          timeframe: "Weeks 7-9",
          title: "Message Queues, WebSockets & GraphQL",
          focusArea: "BullMQ/RabbitMQ, WebSockets & GraphQL Schemas",
          keyObjectives: ["Handle async jobs in background workers", "Implement real-time bidirectional event streams"],
          suggestedProjects: ["Real-time messaging backend with queue-driven notification worker"],
          recommendedCourses: [
            { title: "GraphQL Architecture", platform: "GraphQL.org", hours: "15 hrs", url: "https://graphql.org/learn/" }
          ]
        },
        {
          phaseNumber: 4,
          timeframe: "Weeks 10-12",
          title: "Containerization, Automated Testing & Deployment",
          focusArea: "Docker, Unit/Integration Tests & Cloud Deployment",
          keyObjectives: ["Achieve comprehensive integration test coverage", "Deploy containerized backend to production with automated CI/CD"],
          suggestedProjects: ["Flagship production microservices architecture deployed to cloud"],
          recommendedCourses: [
            { title: "Redis In-Memory Architectures", platform: "Redis University", hours: "18 hrs", url: "https://university.redis.com/" }
          ]
        }
      ],
      jobPrep: [
        `Explain how you handle database connection pooling and query optimization.`,
        `Describe how you prevent SQL Injection, XSS, and CSRF on backend endpoints.`,
        `Walk through your strategy for cache invalidation (Write-Through vs Cache-Aside).`,
        `Be ready to design a scalable URL shortener or rate limiter during live system design rounds.`
      ]
    };
  }

  // 4. UI/UX & Product Designer
  if (lower.includes("ui") || lower.includes("ux") || lower.includes("design") || lower.includes("product design")) {
    return {
      roleTitle: role,
      marketDemand: "High",
      avgSalary: "$85,000 - $130,000",
      summary: `Tailored intelligence for ${role}. UI/UX and Product Designers craft intuitive user flows, comprehensive design systems in Figma, conduct user research and usability testing, and ensure accessibility (WCAG) compliance.`,
      matchedSkills: [
        { skill: "Visual Design Foundations", currentLevel: "Intermediate", strengthAssessment: "Understanding of typography, hierarchy, color theory, and whitespace." },
        { skill: "Wireframing & User Flows", currentLevel: "Intermediate", strengthAssessment: "Creating low-fidelity wireframes and user journey maps." },
        { skill: "Empathy & User-Centric Thinking", currentLevel: "Advanced", strengthAssessment: "Focusing on intuitive problem solving and reducing cognitive load." }
      ],
      skillGaps: [
        {
          skill: "Advanced Figma & Design Systems Architecture",
          category: "Tooling",
          currentLevel: "Beginner",
          requiredLevel: "Advanced",
          priority: "Critical",
          gapDescription: "Auto-layout, variables, interactive component variants, and design token libraries.",
          actionPlan: "Build a comprehensive design system in Figma with typography, color tokens, buttons, and form components.",
          estimatedTimeToBridge: "2-3 weeks"
        },
        {
          skill: "Usability Testing & User Research Methodologies",
          category: "Research",
          currentLevel: "Beginner",
          requiredLevel: "Advanced",
          priority: "Critical",
          gapDescription: "Conducting user interviews, heuristic evaluations, and A/B test analysis.",
          actionPlan: "Conduct 5 recorded usability tests on an interactive prototype and document actionable insights.",
          estimatedTimeToBridge: "2 weeks"
        },
        {
          skill: "Web Accessibility (WCAG 2.1 AA) & Inclusive Design",
          category: "Accessibility",
          currentLevel: "Missing",
          requiredLevel: "Intermediate",
          priority: "High",
          gapDescription: "Color contrast ratios, touch target sizing, screen reader support, and keyboard navigation.",
          actionPlan: "Audit UI screens with Stark plugin to guarantee 100% WCAG AA compliance.",
          estimatedTimeToBridge: "1-2 weeks"
        },
        {
          skill: "Micro-Interactions & Prototyping (Figma / ProtoPie)",
          category: "Prototyping",
          currentLevel: "Beginner",
          requiredLevel: "Intermediate",
          priority: "High",
          gapDescription: "High-fidelity interactive transitions, smart animate, and realistic mobile touch prototypes.",
          actionPlan: "Create an interactive micro-animated prototype demonstrating smooth gesture-based screen transitions.",
          estimatedTimeToBridge: "2 weeks"
        }
      ],
      courses: [
        {
          title: "Google UX Design Professional Certificate",
          platform: "Coursera & Google Official",
          hours: "30 hrs",
          cert: "Google UX Design Certified",
          url: "https://www.coursera.org/professional-certificates/google-ux-design"
        },
        {
          title: "Figma Official Design Systems & Auto-Layout Tutorials",
          platform: "Figma Learn Official",
          hours: "18 hrs",
          cert: "Figma Certified Design Specialist",
          url: "https://help.figma.com/hc/en-us/categories/360002051613"
        },
        {
          title: "Interaction Design Foundation: Human-Computer Interaction",
          platform: "IxDF Official",
          hours: "22 hrs",
          cert: "HCI & Interaction Design Master",
          url: "https://www.interaction-design.org/"
        },
        {
          title: "Web Accessibility & Design Guidelines",
          platform: "Google Web.dev",
          hours: "12 hrs",
          cert: "Accessible Design Certified",
          url: "https://web.dev/learn/accessibility/"
        }
      ],
      projects: [
        {
          title: "End-to-End Mobile App Redesign & Case Study",
          desc: "Complete user research, persona creation, wireframing, high-fidelity Figma prototype, and usability test results."
        },
        {
          title: "Multi-Brand SaaS Design System & Component Library",
          desc: "Scalable Figma design system with tokens, responsive auto-layout components, dark/light themes, and documentation."
        },
        {
          title: "FinTech Web App Dashboard with Micro-Interactions",
          desc: "High-fidelity clickable prototype with interactive financial charts, accessible data tables, and onboarding flows."
        }
      ],
      phases: [
        {
          phaseNumber: 1,
          timeframe: "Weeks 1-3",
          title: "UX Research, Empathy & Information Architecture",
          focusArea: "User Interviews, Personas, Journey Maps & Wireframes",
          keyObjectives: ["Identify user pain points and define problem statements", "Create low-fidelity wireframes and site maps"],
          suggestedProjects: ["Comprehensive UX research plan and paper wireframe prototype"],
          recommendedCourses: [
            { title: "Google UX Design Certificate", platform: "Coursera", hours: "30 hrs", url: "https://www.coursera.org/professional-certificates/google-ux-design" }
          ]
        },
        {
          phaseNumber: 2,
          timeframe: "Weeks 4-6",
          title: "Figma Mastery, Auto-Layout & Design Systems",
          focusArea: "Component Variants, Design Tokens & Auto-Layout",
          keyObjectives: ["Build reusable, responsive UI components in Figma", "Establish cohesive typography and color token systems"],
          suggestedProjects: ["Complete modular design system with responsive auto-layout components"],
          recommendedCourses: [
            { title: "Figma Official Tutorials", platform: "Figma Learn", hours: "18 hrs", url: "https://help.figma.com/hc/en-us/categories/360002051613" }
          ]
        },
        {
          phaseNumber: 3,
          timeframe: "Weeks 7-9",
          title: "Interactive Prototyping & Usability Testing",
          focusArea: "Smart Animate, Micro-Interactions & Usability Testing",
          keyObjectives: ["Build clickable high-fidelity prototypes with realistic transitions", "Conduct moderated usability test sessions and iterate"],
          suggestedProjects: ["Interactive mobile prototype with documented usability improvements"],
          recommendedCourses: [
            { title: "Interaction Design & HCI", platform: "IxDF", hours: "22 hrs", url: "https://www.interaction-design.org/" }
          ]
        },
        {
          phaseNumber: 4,
          timeframe: "Weeks 10-12",
          title: "Accessibility Audit, Portfolio Showcase & Presentation",
          focusArea: "WCAG 2.1 AA Compliance, Case Study Formulation & Pitch",
          keyObjectives: ["Verify 100% WCAG accessibility compliance across color and touch targets", "Format compelling portfolio case studies ready for recruiters"],
          suggestedProjects: ["3 flagship UX case studies published with interactive prototypes"],
          recommendedCourses: [
            { title: "Accessible Design Guidelines", platform: "Google Web.dev", hours: "12 hrs", url: "https://web.dev/learn/accessibility/" }
          ]
        }
      ],
      jobPrep: [
        `Be prepared to walk through your design process (Discover -> Define -> Ideate -> Prototype -> Test).`,
        `Practice conducting a 45-minute whiteboard design challenge under interview conditions.`,
        `Prepare rationale for every visual decision (typography, spacing, color choices, accessibility trade-offs).`,
        `Explain how you collaborate with frontend engineers to ensure design tokens and handoffs are implemented accurately.`
      ]
    };
  }

  // 2. Data Scientist / Machine Learning / AI Engineer
  if (lower.includes("data") || lower.includes("machine learning") || lower.includes("ml") || lower.includes("ai") || lower.includes("artificial intelligence")) {
    return {
      roleTitle: role,
      marketDemand: "Extremely High",
      avgSalary: "$105,000 - $160,000",
      summary: `Tailored intelligence for ${role}. Success requires strong analytical programming (Python, SQL), statistical inference, exploratory data analysis, machine learning modeling (Scikit-Learn, PyTorch/TensorFlow), and communicating data insights.`,
      matchedSkills: [
        { skill: "Python Programming", currentLevel: "Intermediate", strengthAssessment: "Proficiency with object-oriented and functional Python syntax." },
        { skill: "Basic SQL & Queries", currentLevel: "Intermediate", strengthAssessment: "Filtering, grouping, joins, and aggregating tabular datasets." },
        { skill: "Analytical Problem Solving", currentLevel: "Advanced", strengthAssessment: "Breaking down business hypotheses into data-driven questions." }
      ],
      skillGaps: [
        {
          skill: "Pandas & NumPy Data Wrangling",
          category: "Data Processing",
          currentLevel: "Beginner",
          requiredLevel: "Advanced",
          priority: "Critical",
          gapDescription: "Cleaning messy real-world datasets, handling null values, and vectorized transformations.",
          actionPlan: "Complete 10 hands-on Kaggle data manipulation notebooks.",
          estimatedTimeToBridge: "2 weeks"
        },
        {
          skill: "Supervised & Unsupervised Machine Learning",
          category: "Machine Learning",
          currentLevel: "Beginner",
          requiredLevel: "Advanced",
          priority: "Critical",
          gapDescription: "Regression, Random Forests, XGBoost, Clustering, and cross-validation techniques.",
          actionPlan: "Train and evaluate models using Scikit-Learn with feature scaling and hyperparameter tuning.",
          estimatedTimeToBridge: "3-4 weeks"
        },
        {
          skill: "Deep Learning & LLM / RAG Architectures",
          category: "AI & Deep Learning",
          currentLevel: "Missing",
          requiredLevel: "Intermediate",
          priority: "High",
          gapDescription: "Neural networks, PyTorch/TensorFlow, and vector embeddings for generative AI.",
          actionPlan: "Build an end-to-end RAG pipeline using Python, LangChain/LlamaIndex, and a vector database.",
          estimatedTimeToBridge: "3 weeks"
        },
        {
          skill: "ML Model Deployment & FastAPI",
          category: "MLOps",
          currentLevel: "Missing",
          requiredLevel: "Intermediate",
          priority: "High",
          gapDescription: "Wrapping trained models in production REST APIs and creating interactive dashboards.",
          actionPlan: "Deploy an ML inference service with FastAPI and a Streamlit interactive frontend.",
          estimatedTimeToBridge: "2 weeks"
        }
      ],
      courses: [
        {
          title: "Python for Data Science, AI & Development",
          platform: "Coursera & IBM Official",
          hours: "22 hrs",
          cert: "Data Science Professional Certificate",
          url: "https://www.coursera.org/learn/python-for-applied-data-science-ai"
        },
        {
          title: "Kaggle Applied Machine Learning & Data Visualization",
          platform: "Kaggle Learn Official",
          hours: "20 hrs",
          cert: "Kaggle ML Certified",
          url: "https://www.kaggle.com/learn"
        },
        {
          title: "Machine Learning Specialization by Andrew Ng",
          platform: "DeepLearning.AI & Stanford",
          hours: "35 hrs",
          cert: "Machine Learning Master",
          url: "https://www.deeplearning.ai/courses/machine-learning-specialization/"
        },
        {
          title: "Practical Deep Learning for Coders",
          platform: "Fast.ai Official",
          hours: "25 hrs",
          cert: "Deep Learning Practitioner",
          url: "https://course.fast.ai/"
        }
      ],
      projects: [
        {
          title: "Predictive Customer Churn ML Classification Model",
          desc: "End-to-end ML project with EDA, feature engineering, cross-validation, and ROC-AUC performance evaluation."
        },
        {
          title: "Generative AI RAG Document Search Agent",
          desc: "Retrieval-Augmented Generation agent querying technical documents with embeddings and vector storage."
        },
        {
          title: "Real-Time Stock / Financial Sentiment Dashboard",
          desc: "NLP pipeline analyzing financial headlines with HuggingFace transformers and visualizing insights in Streamlit."
        }
      ],
      phases: [
        {
          phaseNumber: 1,
          timeframe: "Weeks 1-3",
          title: "Python, NumPy, Pandas & Data Wrangling",
          focusArea: "Exploratory Data Analysis & Statistical Foundations",
          keyObjectives: ["Clean raw multi-source datasets", "Perform statistical hypothesis testing and visualization"],
          suggestedProjects: ["Comprehensive Exploratory Data Analysis (EDA) notebook on Kaggle dataset"],
          recommendedCourses: [
            { title: "Python for Data Science", platform: "Coursera", hours: "22 hrs", url: "https://www.coursera.org/learn/python-for-applied-data-science-ai" }
          ]
        },
        {
          phaseNumber: 2,
          timeframe: "Weeks 4-6",
          title: "Applied Machine Learning & Feature Engineering",
          focusArea: "Classification, Regression, Clustering & Scikit-Learn",
          keyObjectives: ["Train decision trees, ensemble models, and SVMs", "Tune hyperparameters using GridSearchCV"],
          suggestedProjects: ["Predictive classification system with feature importance breakdown"],
          recommendedCourses: [
            { title: "Kaggle Applied ML", platform: "Kaggle Learn", hours: "20 hrs", url: "https://www.kaggle.com/learn" }
          ]
        },
        {
          phaseNumber: 3,
          timeframe: "Weeks 7-9",
          title: "Deep Learning, NLP & LLMs",
          focusArea: "Neural Networks, PyTorch, Embeddings & RAG",
          keyObjectives: ["Understand backpropagation and transformer architectures", "Implement document search with vector embeddings"],
          suggestedProjects: ["Document analysis AI agent with semantic vector retrieval"],
          recommendedCourses: [
            { title: "Machine Learning Specialization", platform: "DeepLearning.AI", hours: "35 hrs", url: "https://www.deeplearning.ai/courses/machine-learning-specialization/" }
          ]
        },
        {
          phaseNumber: 4,
          timeframe: "Weeks 10-12",
          title: "MLOps, Model Deployment & Portfolio Showcase",
          focusArea: "FastAPI, Docker, Streamlit & Cloud Deployment",
          keyObjectives: ["Wrap models in high-performance APIs", "Publish live interactive web demos for recruiters"],
          suggestedProjects: ["Live deployed AI data dashboard with automated prediction pipeline"],
          recommendedCourses: [
            { title: "Fast.ai Deep Learning", platform: "Fast.ai", hours: "25 hrs", url: "https://course.fast.ai/" }
          ]
        }
      ],
      jobPrep: [
        `Be prepared to explain trade-offs between precision, recall, F1-score, and ROC-AUC.`,
        `Practice writing complex SQL queries (window functions, subqueries, CTEs, self-joins).`,
        `Be ready to present your machine learning portfolio projects end-to-end (Problem -> Data Cleaning -> Model Selection -> Impact).`,
        `Understand bias-variance trade-off, regularization (L1/L2), and handling imbalanced datasets.`
      ]
    };
  }

  // 3. DevOps Engineer / Cloud Engineer / SRE
  if (lower.includes("devops") || lower.includes("cloud") || lower.includes("sre") || lower.includes("infrastructure") || lower.includes("platform")) {
    return {
      roleTitle: role,
      marketDemand: "Very High",
      avgSalary: "$95,000 - $145,000",
      summary: `Tailored intelligence for ${role}. Cloud & DevOps engineers build resilient infrastructure, containerized microservices, automated CI/CD deployment pipelines, and observability monitoring systems.`,
      matchedSkills: [
        { skill: "Linux / Shell Basics", currentLevel: "Intermediate", strengthAssessment: "File permissions, processes, environment variables, and SSH keys." },
        { skill: "Git Automation", currentLevel: "Intermediate", strengthAssessment: "Repo management, branching models, and webhook triggers." },
        { skill: "Networking Fundamentals", currentLevel: "Beginner", strengthAssessment: "DNS, TCP/IP, HTTP/HTTPS, and SSL certificates." }
      ],
      skillGaps: [
        {
          skill: "Docker & Container Architecture",
          category: "Containers",
          currentLevel: "Beginner",
          requiredLevel: "Advanced",
          priority: "Critical",
          gapDescription: "Multi-stage builds, container security, and minimal base images.",
          actionPlan: "Containerize 3 web applications with optimized Dockerfiles.",
          estimatedTimeToBridge: "2 weeks"
        },
        {
          skill: "Kubernetes (K8s) Cluster Orchestration",
          category: "Orchestration",
          currentLevel: "Missing",
          requiredLevel: "Intermediate",
          priority: "Critical",
          gapDescription: "Deployments, Services, Ingress, ConfigMaps, Secrets, and autoscaling.",
          actionPlan: "Deploy a microservice app on Minikube or cloud Kubernetes cluster.",
          estimatedTimeToBridge: "3-4 weeks"
        },
        {
          skill: "Infrastructure as Code (Terraform)",
          category: "IaC",
          currentLevel: "Missing",
          requiredLevel: "Intermediate",
          priority: "High",
          gapDescription: "Automating cloud infrastructure provisioning with reusable Terraform modules.",
          actionPlan: "Write Terraform configuration for cloud VPC, virtual machines, and databases.",
          estimatedTimeToBridge: "2 weeks"
        },
        {
          skill: "CI/CD & GitHub Actions Automation",
          category: "Pipelines",
          currentLevel: "Beginner",
          requiredLevel: "Advanced",
          priority: "High",
          gapDescription: "Automated linting, testing, security scanning, and multi-environment deployment.",
          actionPlan: "Construct automated release pipelines deploying containers to cloud targets on Git tag.",
          estimatedTimeToBridge: "1-2 weeks"
        }
      ],
      courses: [
        {
          title: "Kubernetes Official Interactive Tutorials",
          platform: "Kubernetes.io Official",
          hours: "18 hrs",
          cert: "Certified Kubernetes Associate (CKA) Prep",
          url: "https://kubernetes.io/docs/tutorials/"
        },
        {
          title: "GitHub Actions & Automation Workflows",
          platform: "GitHub Skills Official",
          hours: "10 hrs",
          cert: "GitHub Actions CI/CD Specialist",
          url: "https://skills.github.com/"
        },
        {
          title: "Terraform Infrastructure as Code Tutorials",
          platform: "HashiCorp Official",
          hours: "15 hrs",
          cert: "Terraform Associate Prep",
          url: "https://developer.hashicorp.com/terraform/tutorials"
        },
        {
          title: "Google Cloud / AWS Cloud DevOps Certification Track",
          platform: "Google Cloud Skills Boost",
          hours: "25 hrs",
          cert: "Associate Cloud Engineer",
          url: "https://www.cloudskillsboost.google/"
        }
      ],
      projects: [
        {
          title: "Multi-Tier Automated CI/CD Pipeline on GitHub Actions",
          desc: "Pipeline triggering automated unit tests, Docker build/push, vulnerability scan, and auto-deploy to staging."
        },
        {
          title: "Kubernetes Production Cluster with Ingress & Autoscaling",
          desc: "Deploy a resilient microservice cluster with Horizontal Pod Autoscaler (HPA) and Prometheus monitoring."
        },
        {
          title: "Terraform Multi-Region Cloud Infrastructure Blueprint",
          desc: "IaC provisioning cloud VPC, subnets, managed database, and load balancer with state locking in remote storage."
        }
      ],
      phases: [
        {
          phaseNumber: 1,
          timeframe: "Weeks 1-3",
          title: "Linux, Shell Scripting & Networking Fundamentals",
          focusArea: "System Administration, Bash Automation & SSH Security",
          keyObjectives: ["Master Linux terminal workflows and cron automation", "Configure SSL/TLS, reverse proxies (Nginx), and firewall rules"],
          suggestedProjects: ["Hardened Linux server setup with automated backup script"],
          recommendedCourses: [
            { title: "Linux & Shell Automation", platform: "Linux Foundation", hours: "15 hrs", url: "https://www.linuxfoundation.org/" }
          ]
        },
        {
          phaseNumber: 2,
          timeframe: "Weeks 4-6",
          title: "Docker & Containerization Mastery",
          focusArea: "Multi-Stage Dockerfiles, Volumes & Compose",
          keyObjectives: ["Build lightweight, secure container images", "Orchestrate multi-container dev environments with Docker Compose"],
          suggestedProjects: ["Containerized full-stack application with health checks"],
          recommendedCourses: [
            { title: "Docker Official Guides", platform: "Docker Docs", hours: "12 hrs", url: "https://docs.docker.com/get-started/" }
          ]
        },
        {
          phaseNumber: 3,
          timeframe: "Weeks 7-9",
          title: "CI/CD Pipelines & Terraform (IaC)",
          focusArea: "GitHub Actions, Secret Management & Terraform Modules",
          keyObjectives: ["Build automated test and deployment pipelines", "Provision cloud infrastructure via code"],
          suggestedProjects: ["Complete automated deployment pipeline for web services"],
          recommendedCourses: [
            { title: "GitHub Actions CI/CD", platform: "GitHub Skills", hours: "10 hrs", url: "https://skills.github.com/" }
          ]
        },
        {
          phaseNumber: 4,
          timeframe: "Weeks 10-12",
          title: "Kubernetes Cluster Management & Observability",
          focusArea: "K8s Manifests, Helm, Prometheus & Grafana",
          keyObjectives: ["Deploy and scale microservices on Kubernetes", "Set up real-time alerting and metrics dashboards"],
          suggestedProjects: ["High-availability Kubernetes deployment with live Grafana monitoring"],
          recommendedCourses: [
            { title: "Kubernetes Tutorials", platform: "Kubernetes.io", hours: "18 hrs", url: "https://kubernetes.io/docs/tutorials/" }
          ]
        }
      ],
      jobPrep: [
        `Explain the difference between Docker containers and Virtual Machines.`,
        `Walk through a blue/green or canary deployment strategy step-by-step.`,
        `Describe how you diagnose a failing Kubernetes pod (kubectl logs, describe, events).`,
        `Detail how you secure cloud infrastructure and manage secrets safely in CI/CD.`
      ]
    };
  }

  // 4. Mobile App Developer (iOS / Android / Flutter / React Native)
  if (lower.includes("mobile") || lower.includes("android") || lower.includes("ios") || lower.includes("flutter") || lower.includes("react native")) {
    return {
      roleTitle: role,
      marketDemand: "High",
      avgSalary: "$90,000 - $135,000",
      summary: `Tailored intelligence for ${role}. Mobile engineers create performant native or cross-platform apps (React Native, Flutter, Swift, Kotlin), integrating mobile hardware APIs, state management, offline storage, and responsive touch UI.`,
      matchedSkills: [
        { skill: "Programming Logic (JS/Dart/Kotlin)", currentLevel: "Intermediate", strengthAssessment: "Control flow, data structures, and asynchronous networking." },
        { skill: "REST API Integration", currentLevel: "Intermediate", strengthAssessment: "Fetching and posting JSON payloads over HTTP." },
        { skill: "UI Component Layouts", currentLevel: "Intermediate", strengthAssessment: "Building structured screens with flex layouts and theme variables." }
      ],
      skillGaps: [
        {
          skill: "Mobile Navigation & State Management",
          category: "Architecture",
          currentLevel: "Beginner",
          requiredLevel: "Advanced",
          priority: "Critical",
          gapDescription: "Managing complex tab/stack navigation and global app state across screens.",
          actionPlan: "Master React Navigation / Flutter Navigator and state libraries (Redux Toolkit/Bloc/Provider).",
          estimatedTimeToBridge: "2 weeks"
        },
        {
          skill: "Native Device APIs & Hardware Sensors",
          category: "Mobile Capabilities",
          currentLevel: "Missing",
          requiredLevel: "Intermediate",
          priority: "Critical",
          gapDescription: "Integrating Camera, Geolocation, Push Notifications, and Biometric Auth.",
          actionPlan: "Build an application accessing native camera and GPS coordinates with proper permissions.",
          estimatedTimeToBridge: "2-3 weeks"
        },
        {
          skill: "Offline Caching & Local Database",
          category: "Data",
          currentLevel: "Beginner",
          requiredLevel: "Intermediate",
          priority: "High",
          gapDescription: "Offline-first mobile architectures with SQLite, Realm, or AsyncStorage.",
          actionPlan: "Implement offline caching so the app functions smoothly without active internet.",
          estimatedTimeToBridge: "2 weeks"
        },
        {
          skill: "Mobile App Store Deployment & Signing",
          category: "Release",
          currentLevel: "Missing",
          requiredLevel: "Intermediate",
          priority: "Medium",
          gapDescription: "Generating signed APKs/IPAs, handling app store metadata, and TestFlight/Play Console.",
          actionPlan: "Build and deploy a release binary through Android Studio or Xcode.",
          estimatedTimeToBridge: "1-2 weeks"
        }
      ],
      courses: [
        {
          title: "React Native Official Documentation & Tutorials",
          platform: "React Native Official",
          hours: "20 hrs",
          cert: "React Native Developer",
          url: "https://reactnative.dev/docs/getting-started"
        },
        {
          title: "Flutter & Dart Apprentice Official Track",
          platform: "Flutter.dev Official",
          hours: "22 hrs",
          cert: "Flutter Cross-Platform Certified",
          url: "https://flutter.dev/learn"
        },
        {
          title: "Android App Development with Kotlin",
          platform: "Google Developers Training",
          hours: "30 hrs",
          cert: "Android Associate Developer Prep",
          url: "https://developer.android.com/courses"
        },
        {
          title: "iOS & SwiftUI Development Course",
          platform: "Apple Developer Official",
          hours: "25 hrs",
          cert: "iOS App Developer Track",
          url: "https://developer.apple.com/tutorials/swiftui"
        }
      ],
      projects: [
        {
          title: "Cross-Platform Habit & Wellness Tracker App",
          desc: "Mobile app with custom progress graphs, local notifications, offline database, and dark mode."
        },
        {
          title: "Location-Aware Food / Event Discovery App",
          desc: "Interactive map integration, geolocation filtering, real-time search, and favorite bookmarking."
        },
        {
          title: "Social Media / Community Mobile Client",
          desc: "Photo upload, feed scrolling with infinite pagination, biometric lock, and push notifications."
        }
      ],
      phases: [
        {
          phaseNumber: 1,
          timeframe: "Weeks 1-3",
          title: "Mobile UI Design, Screen Layouts & Navigation",
          focusArea: "Touch Interactions, Responsive Layouts & Stack Navigation",
          keyObjectives: ["Build multi-screen navigation flows", "Implement customized touchable components and animations"],
          suggestedProjects: ["Multi-screen mobile onboarding and profile app"],
          recommendedCourses: [
            { title: "React Native / Flutter Quickstart", platform: "Official Docs", hours: "20 hrs", url: "https://reactnative.dev/docs/getting-started" }
          ]
        },
        {
          phaseNumber: 2,
          timeframe: "Weeks 4-6",
          title: "State Management & REST API Networking",
          focusArea: "Global State Stores, Async Data Fetching & Error Handling",
          keyObjectives: ["Manage persistent global state across complex screens", "Handle network disconnects and loading states"],
          suggestedProjects: ["E-Commerce mobile app with product browsing and cart persistence"],
          recommendedCourses: [
            { title: "Mobile Architecture & State", platform: "Google Developers", hours: "18 hrs", url: "https://developer.android.com/courses" }
          ]
        },
        {
          phaseNumber: 3,
          timeframe: "Weeks 7-9",
          title: "Native Hardware APIs & Offline Storage",
          focusArea: "Camera, GPS, SQLite & Local Push Notifications",
          keyObjectives: ["Request runtime permissions cleanly", "Build offline-first data sync pipelines"],
          suggestedProjects: ["Location-aware notes app with camera attachment and local database"],
          recommendedCourses: [
            { title: "Native Device Capabilities", platform: "Flutter.dev", hours: "15 hrs", url: "https://flutter.dev/learn" }
          ]
        },
        {
          phaseNumber: 4,
          timeframe: "Weeks 10-12",
          title: "Performance Profiling, Testing & App Store Release",
          focusArea: "Memory Leak Profiling, Signing & App Store Publishing",
          keyObjectives: ["Optimize frame rate (60fps) and bundle size", "Generate signed release builds and demo videos"],
          suggestedProjects: ["Flagship cross-platform mobile app published with full case study"],
          recommendedCourses: [
            { title: "App Store Deployment & CI", platform: "Apple/Google Docs", hours: "10 hrs", url: "https://developer.apple.com/tutorials/swiftui" }
          ]
        }
      ],
      jobPrep: [
        `Understand the difference between declarative UI (React Native / Flutter / SwiftUI) and imperative UI.`,
        `Be ready to explain how to optimize list rendering performance (FlatList/ListView recycling).`,
        `Describe how mobile apps handle background lifecycle states (foreground, background, killed).`,
        `Discuss how you manage state and offline synchronization during intermittent connectivity.`
      ]
    };
  }

  // 5. Cybersecurity Specialist / Security Engineer
  if (lower.includes("cyber") || lower.includes("security") || lower.includes("infosec") || lower.includes("penetration") || lower.includes("ethical")) {
    return {
      roleTitle: role,
      marketDemand: "Extremely High",
      avgSalary: "$98,000 - $150,000",
      summary: `Tailored intelligence for ${role}. Cybersecurity professionals safeguard systems, networks, and applications through vulnerability assessment, threat modeling, secure code audits, SIEM log monitoring, and incident response.`,
      matchedSkills: [
        { skill: "Computer Networking Basics", currentLevel: "Intermediate", strengthAssessment: "IP addressing, routing, ports, DNS, and HTTP/HTTPS headers." },
        { skill: "Linux Operating System", currentLevel: "Intermediate", strengthAssessment: "Command line administration, process auditing, and file system permissions." },
        { skill: "Security Mindset", currentLevel: "Advanced", strengthAssessment: "Understanding common threat vectors and defense-in-depth principles." }
      ],
      skillGaps: [
        {
          skill: "OWASP Top 10 Web Security & Exploitation Defense",
          category: "App Security",
          currentLevel: "Beginner",
          requiredLevel: "Advanced",
          priority: "Critical",
          gapDescription: "SQL Injection, XSS, CSRF, Broken Access Control, and SSRF remediation.",
          actionPlan: "Complete hands-on OWASP Juice Shop labs and practice secure coding fixes.",
          estimatedTimeToBridge: "2-3 weeks"
        },
        {
          skill: "Network Analysis & Wireshark Packet Inspection",
          category: "Network Defense",
          currentLevel: "Beginner",
          requiredLevel: "Advanced",
          priority: "Critical",
          gapDescription: "Analyzing PCAP files, identifying unauthorized traffic, and detecting port scans.",
          actionPlan: "Analyze 15 packet captures of common network attacks in Wireshark.",
          estimatedTimeToBridge: "2 weeks"
        },
        {
          skill: "SIEM Log Analysis & Threat Detection",
          category: "Monitoring",
          currentLevel: "Missing",
          requiredLevel: "Intermediate",
          priority: "High",
          gapDescription: "Writing detection rules in Splunk, Elastic Security, or Microsoft Sentinel.",
          actionPlan: "Build custom alert rules for brute-force attacks and privilege escalations.",
          estimatedTimeToBridge: "3 weeks"
        },
        {
          skill: "Security Scripting with Python & Bash",
          category: "Automation",
          currentLevel: "Beginner",
          requiredLevel: "Intermediate",
          priority: "High",
          gapDescription: "Automating port scanning, banner grabbing, and log parsing.",
          actionPlan: "Write a modular multi-threaded port and vulnerability scanner in Python.",
          estimatedTimeToBridge: "2 weeks"
        }
      ],
      courses: [
        {
          title: "Google Cybersecurity Professional Certificate",
          platform: "Coursera & Google Official",
          hours: "30 hrs",
          cert: "Google Cybersecurity Certified",
          url: "https://www.coursera.org/professional-certificates/google-cybersecurity"
        },
        {
          title: "OWASP Top 10 Web Application Security Guide",
          platform: "OWASP.org Official",
          hours: "15 hrs",
          cert: "Application Security Practitioner",
          url: "https://owasp.org/www-project-top-ten/"
        },
        {
          title: "Hands-on Cyber Defense & Network Security Labs",
          platform: "Cybrary & TryHackMe",
          hours: "25 hrs",
          cert: "Cyber Defense Specialist",
          url: "https://www.cybrary.it/"
        },
        {
          title: "Wireshark Network Analysis & Packet Inspection",
          platform: "Wireshark Foundation",
          hours: "18 hrs",
          cert: "Network Security Analyst",
          url: "https://www.wireshark.org/docs/"
        }
      ],
      projects: [
        {
          title: "Automated Multi-Threaded Port & Vulnerability Scanner (Python)",
          desc: "CLI security tool identifying open ports, HTTP headers, SSL expiration, and potential misconfigurations."
        },
        {
          title: "Zero-Trust Identity & Access Management (IAM) Gateway",
          desc: "Secure authentication server with multi-factor auth (MFA), role-based access rules, and immutable audit logs."
        },
        {
          title: "SIEM Intrusion Detection & Threat Analysis Lab",
          desc: "Configured Elastic/Splunk SIEM ingestion pipeline detecting brute force attacks and malicious IP patterns in real-time."
        }
      ],
      phases: [
        {
          phaseNumber: 1,
          timeframe: "Weeks 1-3",
          title: "Networking, Linux Hardening & Cryptography",
          focusArea: "TCP/IP Stack, Linux Security Controls & Symmetric/Asymmetric Encryption",
          keyObjectives: ["Inspect packet traffic and routing behavior", "Understand TLS handshakes, AES, RSA, and hashing algorithms"],
          suggestedProjects: ["Linux server security audit and automated firewall rules script"],
          recommendedCourses: [
            { title: "Google Cybersecurity Certificate", platform: "Coursera", hours: "30 hrs", url: "https://www.coursera.org/professional-certificates/google-cybersecurity" }
          ]
        },
        {
          phaseNumber: 2,
          timeframe: "Weeks 4-6",
          title: "OWASP Top 10 & Web Application Security",
          focusArea: "SQL Injection, Cross-Site Scripting (XSS), CSRF & Broken Auth",
          keyObjectives: ["Identify common application vulnerabilities in source code", "Implement parameterized queries and CSP headers"],
          suggestedProjects: ["Web vulnerability test suite and secure remediation report"],
          recommendedCourses: [
            { title: "OWASP Top 10 Guides", platform: "OWASP.org", hours: "15 hrs", url: "https://owasp.org/www-project-top-ten/" }
          ]
        },
        {
          phaseNumber: 3,
          timeframe: "Weeks 7-9",
          title: "Security Automation & Threat Intelligence",
          focusArea: "Python Security Scripting, APIs & Vulnerability Scanning",
          keyObjectives: ["Build custom automated security auditing scripts", "Parse and correlate threat intelligence feeds"],
          suggestedProjects: ["Automated Python vulnerability scanner with PDF report generation"],
          recommendedCourses: [
            { title: "Cyber Defense Labs", platform: "Cybrary", hours: "25 hrs", url: "https://www.cybrary.it/" }
          ]
        },
        {
          phaseNumber: 4,
          timeframe: "Weeks 10-12",
          title: "SIEM Log Analysis, Incident Response & Portfolio",
          focusArea: "Splunk/Elastic, Incident Handling & Defense Showcase",
          keyObjectives: ["Write alert detection rules for real-time security events", "Document end-to-end incident response playbook"],
          suggestedProjects: ["Complete SIEM detection lab with documented attack simulation & defense"],
          recommendedCourses: [
            { title: "Wireshark Packet Inspection", platform: "Wireshark Foundation", hours: "18 hrs", url: "https://www.wireshark.org/docs/" }
          ]
        }
      ],
      jobPrep: [
        `Walk through the 3-way TCP handshake and describe SYN flood mitigation techniques.`,
        `Explain how SQL injection works and why parameterized queries prevent it.`,
        `Describe the difference between symmetric and asymmetric encryption and when each is used.`,
        `Detail your process for investigating a high-severity alert in a SIEM dashboard.`
      ]
    };
  }

  // 6. Generic / Custom Role Fallback (Handles ANY custom role like "Backend Developer", "Product Manager", "UI/UX Designer", "Blockchain Developer", "Game Developer", "QA Engineer", etc.)
  return {
    roleTitle: role,
    marketDemand: "High",
    avgSalary: "$90,000 - $140,000",
    summary: `Personalized intelligence tailored specifically for ${role}. Bridging your current competencies with targeted technical practices for ${company} will maximize your hiring readiness.`,
    matchedSkills: [
      { skill: "Core Technical Foundations", currentLevel: "Intermediate", strengthAssessment: `Solid foundational capabilities applicable to ${role}.` },
      { skill: "Problem Solving & Logic", currentLevel: "Intermediate", strengthAssessment: "Structured approach to breaking down feature requirements." },
      { skill: "Software Collaboration & Git", currentLevel: "Intermediate", strengthAssessment: "Version control and collaborative engineering practices." }
    ],
    skillGaps: [
      {
        skill: `${role} Core Industry Standards & Frameworks`,
        category: "Specialization",
        currentLevel: "Beginner",
        requiredLevel: "Advanced",
        priority: "Critical",
        gapDescription: `Mastering modern tools and architecture patterns standard for ${role}.`,
        actionPlan: `Complete specialized coursework and build production-grade projects tailored for ${role}.`,
        estimatedTimeToBridge: "3-4 weeks"
      },
      {
        skill: `${company} System Design & Best Practices`,
        category: "Architecture",
        currentLevel: "Beginner",
        requiredLevel: "Intermediate",
        priority: "Critical",
        gapDescription: `Understanding high-availability patterns and standards expected at ${company}.`,
        actionPlan: "Study real-world case studies and architectural blueprints from top tech companies.",
        estimatedTimeToBridge: "2 weeks"
      },
      {
        skill: "Automated Quality Assurance & Testing",
        category: "Quality",
        currentLevel: "Beginner",
        requiredLevel: "Intermediate",
        priority: "High",
        gapDescription: "Unit, integration, and performance benchmarks to ensure software reliability.",
        actionPlan: "Implement automated test suites with high code coverage.",
        estimatedTimeToBridge: "2 weeks"
      },
      {
        skill: "CI/CD & Production Deployment",
        category: "DevOps",
        currentLevel: "Beginner",
        requiredLevel: "Intermediate",
        priority: "Medium",
        gapDescription: "Deploying live demo applications with continuous delivery.",
        actionPlan: "Automate build and deployment pipelines via GitHub Actions.",
        estimatedTimeToBridge: "1-2 weeks"
      }
    ],
    courses: [
      {
        title: `${role} Professional Certification Track`,
        platform: "Coursera & Leading Universities",
        hours: "25 hrs",
        cert: `${role} Professional Certificate`,
        url: `https://www.coursera.org/search?query=${encodeURIComponent(role)}`
      },
      {
        title: `Comprehensive ${role} Hands-On Curriculum`,
        platform: "freeCodeCamp Official",
        hours: "30 hrs",
        cert: "Full Curriculum Verified",
        url: "https://www.freecodecamp.org/learn/"
      },
      {
        title: "System Architecture & Engineering Scalability",
        platform: "GitHub Open Source Community",
        hours: "18 hrs",
        cert: "System Design Certified",
        url: "https://github.com/donnemartin/system-design-primer"
      },
      {
        title: "GitHub Actions CI/CD & Deployment Automation",
        platform: "GitHub Skills Official",
        hours: "10 hrs",
        cert: "DevOps & CI/CD Practitioner",
        url: "https://skills.github.com/"
      }
    ],
    projects: [
      {
        title: `Flagship ${role} Production Capstone Project`,
        desc: `Architect and deploy an end-to-end application tailored specifically for ${role} showcasing modern best practices.`
      },
      {
        title: `High-Performance ${company}-Style Microservice / Workflow Tool`,
        desc: "Demonstrates scalable architecture, clean API design, and automated testing."
      },
      {
        title: `Interactive Portfolio Showcase for ${role}`,
        desc: "Structured case studies highlighting problem solving, technical challenges, and live demo links."
      }
    ],
    phases: [
      {
        phaseNumber: 1,
        timeframe: "Weeks 1-3",
        title: `${role} Core Foundations`,
        focusArea: "Foundational Concepts, Syntax & Tooling",
        keyObjectives: [`Master primary principles and tools required for ${role}`, "Establish disciplined version control and testing"],
        suggestedProjects: [`Foundational project prototype tailored for ${role}`],
        recommendedCourses: [
          { title: `${role} Professional Track`, platform: "Coursera", hours: "25 hrs", url: `https://www.coursera.org/search?query=${encodeURIComponent(role)}` }
        ]
      },
      {
        phaseNumber: 2,
        timeframe: "Weeks 4-6",
        title: `Applied Frameworks & Intermediate Architecture`,
        focusArea: "Specialized Libraries, State Management & API Integration",
        keyObjectives: ["Implement complex business logic and state synchronization", "Connect with modern backend services and databases"],
        suggestedProjects: [`Functional multi-tier application tailored for ${role}`],
        recommendedCourses: [
          { title: "freeCodeCamp Curriculum", platform: "freeCodeCamp", hours: "30 hrs", url: "https://www.freecodecamp.org/learn/" }
        ]
      },
      {
        phaseNumber: 3,
        timeframe: "Weeks 7-9",
        title: `System Architecture, Scalability & Security`,
        focusArea: "Design Patterns, Performance Optimization & Security",
        keyObjectives: ["Optimize response latencies and memory usage", "Implement role-based security controls and error isolation"],
        suggestedProjects: [`Scalable microservice or optimization module for ${role}`],
        recommendedCourses: [
          { title: "System Design Primer", platform: "GitHub Community", hours: "18 hrs", url: "https://github.com/donnemartin/system-design-primer" }
        ]
      },
      {
        phaseNumber: 4,
        timeframe: "Weeks 10-12",
        title: `CI/CD Automation, Capstone & Portfolio Delivery`,
        focusArea: "Production Deployment, Testing & Live Demonstration",
        keyObjectives: ["Deploy live production build with automated CI/CD", "Prepare portfolio case studies and interview talking points"],
        suggestedProjects: [`Flagship capstone project published with live demo for ${role}`],
        recommendedCourses: [
          { title: "GitHub Actions Automation", platform: "GitHub Skills", hours: "10 hrs", url: "https://skills.github.com/" }
        ]
      }
    ],
    jobPrep: [
      `Review core data structures, algorithms, and system design patterns relevant to ${role}.`,
      `Prepare 4 STAR method behavioral stories detailing technical leadership, problem solving, and impact.`,
      `Conduct mock technical walkthroughs explaining architectural decisions made in your portfolio projects.`,
      `Connect with engineers and recruiters hiring for ${role} at ${company} on LinkedIn.`
    ]
  };
}
