import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Bell, Shield, Key, Palette, Save, CheckCircle } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../contexts/AuthContext";

const SettingsPage = () => {
  const { user, updateUser, logout } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
  }, [user]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ name: name.trim(), email: email.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const sections = [
    { icon: Bell, title: "Notifications", desc: "Set alerts for new papers and workspace updates" },
    { icon: Shield, title: "Security", desc: "Two-factor authentication and session management" },
    { icon: Palette, title: "Appearance", desc: "Theme and display preferences" },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-display font-bold text-foreground">
            <span className="glow-text">Settings</span>
          </h1>
          <p className="text-muted-foreground mt-1">Manage your account and preferences.</p>
        </motion.div>

        <div className="mt-8 space-y-4">
          {/* Profile Section - Functional */}
          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground">Profile</h3>
                <p className="text-sm text-muted-foreground">Update your name and email</p>
              </div>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground input-glow focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground input-glow focus:outline-none focus:border-primary/50"
                />
              </div>
              <div className="flex items-center gap-3">
                <motion.button
                  type="submit"
                  className="px-5 py-2 rounded-lg gradient-primary text-primary-foreground font-semibold text-sm flex items-center gap-2"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </motion.button>
                {saved && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5 text-sm text-success"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Saved!
                  </motion.div>
                )}
              </div>
            </form>
          </motion.div>

          {/* AI Key Section */}
          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Key className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground">AI Integration</h3>
                <p className="text-sm text-muted-foreground">OpenRouter · DeepSeek Chat</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-success/10 border border-success/30">
              <CheckCircle className="w-4 h-4 text-success" />
              <span className="text-sm text-success font-medium">Gemini API connected and active</span>
            </div>
          </motion.div>

          {/* Other sections */}
          {sections.map((item, i) => (
            <motion.div
              key={item.title}
              className="glass-card-hover p-5 flex items-center gap-4 cursor-pointer"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (i + 2) * 0.08 }}
              whileHover={{ x: 6 }}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </motion.div>
          ))}

          {/* Danger zone */}
          <motion.div
            className="glass-card p-5"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="font-display font-semibold text-destructive mb-3">Danger Zone</h3>
            <button
              onClick={logout}
              className="px-5 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors"
            >
              Sign Out
            </button>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
