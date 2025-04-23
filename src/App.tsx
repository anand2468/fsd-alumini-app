import { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, User, LogOut, Briefcase, GraduationCap, Mail, Phone, Search } from 'lucide-react';

// Helper function to create deep copies
const deepCopy = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

// Types
type User = {
  id: string;
  email: string;
  displayName: string;
  password: string;
  profileImage?: string;
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
    profileImage: 'https://randomuser.me/api/portraits/men/1.jpg'
  }
];

let postsDatabase: Post[] = [
  {
    id: '1',
    title: 'Welcome to Alumni Connect',
    content: 'This is a sample post to get started. Share your experiences!',
    author: usersDatabase[0],
    createdAt: new Date('2023-01-15')
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

  signUp: async (userData: Omit<User, 'id'>): Promise<User> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (usersDatabase.some(u => u.email === userData.email)) {
          reject(new Error('Email already in use'));
          return;
        }

        const newUser: User = {
          id: `user-${Date.now()}`,
          ...userData
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
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [postForm, setPostForm] = useState({
    title: '',
    content: ''
  });
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
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setPosts(postsDatabase.filter(post => 
          post.author.id === currentUser.id || 
          usersDatabase.some(u => u.id === post.author.id)
        ));
      } else {
        setPosts([]);
      }
    });
    return () => unsubscribe();
  }, []);

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
        profileImage: registerForm.profileImage || undefined
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
    if (!user || !postForm.title || !postForm.content) return;
    
    const newPost: Post = {
      id: Date.now().toString(),
      title: postForm.title,
      content: postForm.content,
      author: deepCopy(user),
      createdAt: new Date()
    };
    
    postsDatabase = [newPost, ...postsDatabase];
    setPosts([newPost, ...posts]);
    setPostForm({ title: '', content: '' });
    setIsCreating(false);
  };

  const handleUpdatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPostId || !postForm.title || !postForm.content) return;
    
    postsDatabase = postsDatabase.map(post => 
      post.id === editingPostId 
        ? { ...post, title: postForm.title, content: postForm.content }
        : post
    );
    
    setPosts(posts.map(post => 
      post.id === editingPostId 
        ? { ...post, title: postForm.title, content: postForm.content }
        : post
    ));
    
    setPostForm({ title: '', content: '' });
    setEditingPostId(null);
    setIsCreating(false);
  };

  const handleDeletePost = (postId: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      postsDatabase = postsDatabase.filter(post => post.id !== postId);
      setPosts(posts.filter(post => post.id !== postId));
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Alumni Connect</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLogout}
              className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <LogOut className="h-5 w-5 mr-1" />
              Sign Out
            </button>
            <div className="flex items-center">
              <img 
                src={user.profileImage || 'https://randomuser.me/api/portraits/lego/1.jpg'} 
                alt="Profile" 
                className="h-8 w-8 rounded-full"
              />
              <span className="ml-2 text-sm font-medium">{user.displayName}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('feed')}
            className={`py-2 px-4 font-medium text-sm ${activeTab === 'feed' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Feed
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-4 font-medium text-sm ${activeTab === 'profile' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`py-2 px-4 font-medium text-sm ${activeTab === 'search' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Search
          </button>
        </div>

        {activeTab === 'feed' && (
          <div>
            <button
              onClick={() => {
                setIsCreating(true);
                setEditingPostId(null);
                setPostForm({ title: '', content: '' });
              }}
              className="mb-4 flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Post
            </button>

            {isCreating && (
              <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h2 className="text-lg font-medium mb-4">{editingPostId ? 'Edit Post' : 'Create Post'}</h2>
                <form onSubmit={editingPostId ? handleUpdatePost : handleCreatePost}>
                  <div className="mb-4">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      id="title"
                      name="title"
                      type="text"
                      value={postForm.title}
                      onChange={(e) => setPostForm({...postForm, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                      Content
                    </label>
                    <textarea
                      id="content"
                      name="content"
                      rows={4}
                      value={postForm.content}
                      onChange={(e) => setPostForm({...postForm, content: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {editingPostId ? 'Update Post' : 'Create Post'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-6">
              {posts.length === 0 ? (
                <div className="bg-white shadow rounded-lg p-6 text-center">
                  <p className="text-gray-500">No posts yet. Be the first to share your experience!</p>
                </div>
              ) : (
                posts.map(post => (
                  <div key={post.id} className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <img 
                            src={post.author.profileImage || 'https://randomuser.me/api/portraits/lego/1.jpg'} 
                            alt={post.author.displayName} 
                            className="h-10 w-10 rounded-full"
                          />
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-gray-900">{post.author.displayName}</h3>
                            <p className="text-sm text-gray-500">
                              {formatDate(post.createdAt)}
                            </p>
                          </div>
                        </div>
                        {post.author.id === user.id && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setEditingPostId(post.id);
                                setPostForm({
                                  title: post.title,
                                  content: post.content
                                });
                                setIsCreating(true);
                              }}
                              className="text-gray-400 hover:text-gray-500"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="text-gray-400 hover:text-gray-500"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="mt-4">
                        <h2 className="text-lg font-semibold text-gray-900">{post.title}</h2>
                        <p className="mt-2 text-gray-600 whitespace-pre-line">{post.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Your Profile</h2>
            </div>
            <div className="px-6 py-4">
              <div className="flex items-center mb-6">
                <img 
                  src={user.profileImage || 'https://randomuser.me/api/portraits/lego/1.jpg'} 
                  alt="Profile" 
                  className="h-16 w-16 rounded-full"
                />
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {user.displayName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Search Alumni</h2>
              <div className="mt-2 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.trim() === '') {
                      setSearchResults([]);
                    } else {
                      const results = usersDatabase.filter(user => 
                        user.displayName.toLowerCase().includes(e.target.value.toLowerCase()) ||
                        user.email.toLowerCase().includes(e.target.value.toLowerCase())
                      );
                      setSearchResults(results);
                    }
                  }}
                  placeholder="Search by name or email..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <div key={result.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center">
                      <img 
                        src={result.profileImage || 'https://randomuser.me/api/portraits/lego/1.jpg'} 
                        alt={result.displayName} 
                        className="h-10 w-10 rounded-full"
                      />
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-900">{result.displayName}</h3>
                        <p className="text-sm text-gray-500">{result.email}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-4 text-center">
                  <p className="text-gray-500">
                    {searchQuery ? 'No results found' : 'Enter a search term to find alumni'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}