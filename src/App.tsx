import { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, User, LogOut, Briefcase, GraduationCap, Mail, Phone, Search } from 'lucide-react';

// Helper function to create deep copies
const deepCopy = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

// Types
type Education = {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
};

type WorkExperience = {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
};

type Profile = {
  bio: string;
  email: string;
  phone: string;
  location: string;
  skills: string[];
  education: Education[];
  workExperience: WorkExperience[];
  profileImage?: string;
};

type User = {
  id: string;
  email: string;
  displayName: string;
  password: string;
  profile: Profile;
};

type Post = {
  id: string;
  title: string;
  content: string;
  author: User;
  createdAt: Date;
};

// In-memory database
let usersDatabase: User[] = [
  {
    id: 'user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    password: 'password123',
    profile: {
      bio: 'Alumni passionate about technology and education',
      email: 'test@example.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      skills: ['React', 'Node.js', 'TypeScript', 'UI/UX'],
      education: [
        {
          id: 'edu-1',
          institution: 'Stanford University',
          degree: 'Master of Science',
          fieldOfStudy: 'Computer Science',
          startYear: '2015',
          endYear: '2017'
        }
      ],
      workExperience: [
        {
          id: 'work-1',
          company: 'Tech Corp',
          position: 'Senior Software Engineer',
          startDate: '2019',
          endDate: 'Present',
          description: 'Leading frontend development team'
        }
      ],
      profileImage: 'https://randomuser.me/api/portraits/men/1.jpg'
    }
  }
];

// Auth service
const authService = {
  currentUser: null as User | null,
  
  getCurrentUser: () => deepCopy(authService.currentUser),
  
  signIn: async (email: string, password: string): Promise<User> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = usersDatabase.find(u => u.email === email);
        if (user && user.password === password) {
          authService.currentUser = deepCopy(user);
          resolve(deepCopy(user));
        } else {
          reject(new Error('Invalid email or password'));
        }
      }, 500);
    });
  },

  signUp: async (userData: Omit<User, 'id' | 'profile'> & { profileImage?: string }): Promise<User> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (usersDatabase.some(u => u.email === userData.email)) {
          reject(new Error('Email already in use'));
          return;
        }

        const newUser: User = {
          id: `user-${Date.now()}`,
          ...userData,
          profile: {
            bio: '',
            email: userData.email,
            phone: '',
            location: '',
            skills: [],
            education: [],
            workExperience: [],
            profileImage: userData.profileImage || 'https://randomuser.me/api/portraits/lego/1.jpg'
          }
        };

        usersDatabase.push(deepCopy(newUser));
        authService.currentUser = deepCopy(newUser);
        resolve(deepCopy(newUser));
      }, 500);
    });
  },
  
  signOut: async (): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        authService.currentUser = null;
        resolve();
      }, 300);
    });
  },
  
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    const interval = setInterval(() => {
      callback(authService.currentUser ? deepCopy(authService.currentUser) : null);
    }, 1000);
    return () => clearInterval(interval);
  }
};

export default function AlumniConnect() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });
  const [user, setUser] = useState<User | null>(null);
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  const [registerForm, setRegisterForm] = useState({
    email: '',
    displayName: '',
    password: '',
    confirmPassword: '',
    profileImage: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'profile' | 'search'>('feed');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<Profile>({
    bio: '',
    email: '',
    phone: '',
    location: '',
    skills: [],
    education: [],
    workExperience: []
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [viewingProfile, setViewingProfile] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setUser(user ? deepCopy(user) : null);
      if (user) {
        setProfileForm(deepCopy(user.profile));
        loadSamplePosts(deepCopy(user));
      } else {
        setPosts([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadSamplePosts = (currentUser: User) => {
    const samplePosts: Post[] = [
      {
        id: '1',
        title: 'My First Alumni Experience',
        content: 'Attending the university was a transformative experience that shaped my career and personal growth.',
        author: deepCopy(currentUser),
        createdAt: new Date('2023-01-15')
      },
      {
        id: '2',
        title: 'Career Advice for New Grads',
        content: 'Network early and often - many of my best opportunities came from alumni connections I made during school.',
        author: deepCopy(usersDatabase[0]),
        createdAt: new Date('2023-02-20')
      }
    ];
    setPosts(samplePosts);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authService.signIn(loginForm.email, loginForm.password);
    } catch (error) {
      alert('Login failed: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerForm.password !== registerForm.confirmPassword) {
      alert("Passwords don't match");
      return;
    }

    setIsLoading(true);
    try {
      await authService.signUp({
        email: registerForm.email,
        displayName: registerForm.displayName,
        password: registerForm.password,
        profileImage: registerForm.profileImage
      });
    } catch (error) {
      alert('Registration failed: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await authService.signOut();
    } catch (error) {
      alert('Logout failed: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.title || !formData.content) return;
    
    const newPost: Post = {
      id: Date.now().toString(),
      title: formData.title,
      content: formData.content,
      author: deepCopy(user),
      createdAt: new Date()
    };
    
    setPosts(prevPosts => [newPost, ...prevPosts]);
    setFormData({ title: '', content: '' });
    setIsCreating(false);
  };

  const handleUpdatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPostId || !formData.title || !formData.content) return;
    
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === editingPostId 
          ? { 
              ...deepCopy(post), 
              title: formData.title, 
              content: formData.content 
            } 
          : deepCopy(post)
      )
    );
    
    setFormData({ title: '', content: '' });
    setEditingPostId(null);
    setIsCreating(false);
  };

  const handleDeletePost = (postId: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    }
  };

  const handleViewProfile = (user: User) => {
    setViewingProfile(deepCopy(user));
    setActiveTab('profile');
  };

  const handleBackToFeed = () => {
    setViewingProfile(null);
    setActiveTab('feed');
  };

  const handleUpdateProfile = () => {
    if (!user) return;
    
    const updatedUser = {
      ...deepCopy(user),
      profile: deepCopy(profileForm)
    };
    
    // Update in our in-memory database
    usersDatabase = usersDatabase.map(u => 
      u.id === user.id ? deepCopy(updatedUser) : u
    );
    
    setUser(updatedUser);
    setIsEditingProfile(false);
    
    // Update posts where this user is the author
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.author.id === user.id
          ? {
              ...deepCopy(post),
              author: deepCopy(updatedUser)
            }
          : deepCopy(post)
      )
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6">Alumni Connect</h1>
          
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 px-4 text-center font-medium ${authMode === 'login' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-2 px-4 text-center font-medium ${authMode === 'register' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Register
            </button>
          </div>

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                  placeholder="Enter your email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  placeholder="Enter your password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
              <div className="text-center text-sm text-gray-600">
                <p>Demo account:</p>
                <p>Email: test@example.com</p>
                <p>Password: password123</p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                  placeholder="Enter your email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="register-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  id="register-name"
                  name="displayName"
                  type="text"
                  value={registerForm.displayName}
                  onChange={(e) => setRegisterForm({...registerForm, displayName: e.target.value})}
                  placeholder="Enter your name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="register-password"
                  name="password"
                  type="password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                  placeholder="Enter your password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="register-confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  id="register-confirm-password"
                  name="confirmPassword"
                  type="password"
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                  placeholder="Confirm your password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="register-profile-image" className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Image URL (optional)
                </label>
                <input
                  id="register-profile-image"
                  name="profileImage"
                  type="url"
                  value={registerForm.profileImage}
                  onChange={(e) => setRegisterForm({...registerForm, profileImage: e.target.value})}
                  placeholder="https://example.com/profile.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Registering...' : 'Register'}
              </button>
              <div className="text-center text-sm text-gray-600">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-blue-600 hover:text-blue-500"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ... [Rest of the component remains the same as in the previous implementation]
  // The main app UI after login is identical to the previous version
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header and main app content */}
      {/* ... */}
    </div>
  );
}