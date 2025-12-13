import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { 
  Play, 
  Pause, 
  Target, 
  Trophy, 
  Sparkles, 
  X, 
  Check, 
  Zap, 
  BookOpen, 
  Tag, 
  MapPin, 
  Clock,
  Brain,
  Coffee,
  Sunrise,
  Moon,
  Cloud,
  Wifi,
  Bell,
  Star,
  TrendingUp
} from "lucide-react";

// ============== TYPES ==============
type Coordinates = {
  lat: number;
  lon: number;
};

type Lesson = {
  id: string;
  title: string;
  tags: string[];
  text: string;
  xp: number;
  icon: string;
  color: string;
};

type LessonItem = Lesson & {
  triggeredAt?: number;
  context?: Context;
};

type Profile = {
  name: string;
  skills: string[];
  xp: number;
  streak: number;
  level: number;
};

type Context = {
  timeOfDay: "morning" | "afternoon" | "evening" | "manual";
  tags: string[];
  coords: Coordinates | null;
  mood: string;
};

type LastTrigger = {
  lessonId: string;
  at: number;
} | null;

// ============== CONSTANTS ==============
const INITIAL_PROFILE: Profile = {
  name: "Alex Chen",
  skills: ["Productivity", "AI Literacy", "Culinary Arts", "Mindfulness", "Finance"],
  xp: 245,
  streak: 14,
  level: 7,
};

const LESSONS: Lesson[] = [
  {
    id: "p1",
    title: "Productivity Pulse",
    tags: ["Productivity", "Focus", "Time Management"],
    text: "Apply the 2-Minute Rule: if a task takes less than two minutes, do it immediately. This prevents small tasks from piling up.",
    xp: 25,
    icon: "⚡",
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "c1",
    title: "Culinary Chemistry",
    tags: ["Cooking", "Science", "Kitchen"],
    text: "Add a pinch of salt to coffee grounds before brewing to reduce bitterness by blocking bitter receptors on your tongue.",
    xp: 30,
    icon: "🍳",
    color: "from-rose-500 to-pink-500",
  },
  {
    id: "a1",
    title: "AI Insight",
    tags: ["AI", "Technology", "Learning"],
    text: "Attention mechanisms in transformers allow models to focus on relevant parts of input, similar to human concentration.",
    xp: 40,
    icon: "🤖",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "s1",
    title: "Mindful Minute",
    tags: ["Wellness", "Mindfulness", "Health"],
    text: "Practice 'box breathing': inhale 4s, hold 4s, exhale 4s, hold 4s. Repeat 4 times to reset your nervous system.",
    xp: 20,
    icon: "🧘",
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "e1",
    title: "Financial Flash",
    tags: ["Finance", "Investing", "Growth"],
    text: "The Rule of 72: Divide 72 by your annual return rate to estimate how many years it takes to double your investment.",
    xp: 35,
    icon: "💰",
    color: "from-purple-500 to-violet-500",
  },
  {
    id: "h1",
    title: "Health Hack",
    tags: ["Health", "Wellness", "Habit"],
    text: "Drink a glass of water before each meal. This aids digestion and helps with portion control naturally.",
    xp: 15,
    icon: "💧",
    color: "from-sky-500 to-blue-500",
  },
];

const TIME_ICONS = {
  morning: Sunrise,
  afternoon: Coffee,
  evening: Moon,
  manual: Clock,
};

// ============== UTILITIES ==============
const safeGet = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const safeSet = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore localStorage errors
  }
};

const xpToLevel = (xp: number) => {
  const level = Math.floor(Math.sqrt(xp / 10));
  const nextLevelXp = Math.pow(level + 1, 2) * 10;
  const progress = ((xp - Math.pow(level, 2) * 10) / (nextLevelXp - Math.pow(level, 2) * 10)) * 100;
  
  return { 
    level, 
    next: nextLevelXp, 
    progress: Math.min(progress, 100) 
  };
};

const getTimeOfDay = (): "morning" | "afternoon" | "evening" => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
};

const getMood = (): string => {
  const moods = ["Focused", "Curious", "Relaxed", "Energetic", "Creative", "Analytical"];
  return moods[Math.floor(Math.random() * moods.length)];
};

// ============== COMPONENTS ==============
const XPProgressBar = ({ xp }: { xp: number }) => {
  const { level, next, progress } = xpToLevel(xp);
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span className="font-bold text-gray-900">Level {level}</span>
        </div>
        <span className="text-sm font-medium text-gray-600">{xp} / {next} XP</span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>Progress</span>
        <span>{progress.toFixed(1)}%</span>
      </div>
    </div>
  );
};

const StreakBadge = ({ streak }: { streak: number }) => (
  <div className="relative">
    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg blur opacity-30" />
    <div className="relative px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-600" />
        <span className="font-bold text-amber-900">{streak} day streak</span>
      </div>
      <div className="text-xs text-amber-700 mt-1">Keep learning every day!</div>
    </div>
  </div>
);

const LessonCard = ({ 
  lesson, 
  onOpen, 
  onEnqueue 
}: { 
  lesson: Lesson; 
  onOpen: () => void; 
  onEnqueue: () => void; 
}) => (
  <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-gray-300">
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-50 to-transparent -translate-y-16 translate-x-16 rotate-12" />
    
    <div className="relative">
      <div className="flex items-start justify-between mb-4">
        <div className={`text-3xl ${lesson.color.split(' ')[0]} bg-gradient-to-br ${lesson.color} bg-clip-text text-transparent`}>
          {lesson.icon}
        </div>
        <span className="px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 rounded-full text-sm font-bold">
          {lesson.xp} XP
        </span>
      </div>
      
      <h4 className="font-bold text-gray-900 mb-3 text-lg">{lesson.title}</h4>
      <p className="text-gray-600 mb-6 leading-relaxed text-sm">{lesson.text}</p>
      
      <div className="flex flex-wrap gap-2 mb-6">
        {lesson.tags.map((tag) => (
          <span
            key={tag}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium transition-colors group-hover:bg-gray-200"
          >
            {tag}
          </span>
        ))}
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={onEnqueue}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 rounded-xl font-medium hover:from-gray-200 hover:to-gray-100 transition-all duration-300 hover:shadow-md"
        >
          Add to Queue
        </button>
        <button
          onClick={onOpen}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-blue-200 transition-all duration-300 transform hover:-translate-y-0.5"
        >
          Open
        </button>
      </div>
    </div>
  </div>
);

const QueueItem = ({ item, onOpen }: { item: LessonItem; onOpen: () => void }) => {
  const TimeIcon = TIME_ICONS[item.context?.timeOfDay || "manual"];
  
  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 hover:border-blue-300 hover:shadow-md transition-all duration-300">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-cyan-500" />
      
      <div className="pl-3">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {item.context?.timeOfDay && (
                <>
                  <TimeIcon className="w-4 h-4" />
                  <span className="capitalize">{item.context.timeOfDay}</span>
                </>
              )}
              {item.context?.coords && (
                <>
                  <MapPin className="w-4 h-4" />
                  <span>Nearby</span>
                </>
              )}
            </div>
          </div>
          <div className={`text-2xl ${item.color.split(' ')[0]}`}>
            {item.icon}
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.text}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {item.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 rounded-lg text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
          <button
            onClick={onOpen}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-blue-200"
          >
            Learn Now
          </button>
        </div>
      </div>
    </div>
  );
};

const FloatingParticles = ({ active }: { active: boolean }) => {
  if (!active) return null;
  
  return (
    <>
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${3 + Math.random() * 4}s infinite ease-in-out ${Math.random() * 2}s`,
          }}
        >
          <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full blur-sm" />
        </div>
      ))}
    </>
  );
};

// ============== MAIN COMPONENT ==============
export default function AmbientSkillSyncMVP(): React.ReactElement {
  // ============== STATE ==============
  const [ambientOn, setAmbientOn] = useState<boolean>(
    () => safeGet("ambientOn", false)
  );
  const [lessonsSeen, setLessonsSeen] = useState<Record<string, number>>(
    () => safeGet("lessonsSeen", {})
  );
  const [queue, setQueue] = useState<LessonItem[]>([]);
  const [lastTrigger, setLastTrigger] = useState<LastTrigger>(null);
  const [profile, setProfile] = useState<Profile>(INITIAL_PROFILE);
  const [currentLesson, setCurrentLesson] = useState<LessonItem | null>(null);
  const [envTags, setEnvTags] = useState<string[]>(
    () => safeGet("envTags", ["Focus", "Learning", "Wellness"])
  );
  const [lastLocation, setLastLocation] = useState<Coordinates | null>(null);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [xpGained, setXpGained] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);

  const ambientIntervalRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ============== EFFECTS ==============
  useEffect(() => {
    safeSet("ambientOn", ambientOn);
    safeSet("profile", profile);
    safeSet("lessonsSeen", lessonsSeen);
    safeSet("envTags", envTags);
  }, [ambientOn, profile, lessonsSeen, envTags]);

  // Ambient engine
  useEffect(() => {
    const buildSimulatedContext = (): Context => {
      const timeOfDay = getTimeOfDay();
      const mood = getMood();
      const idle = Math.random() > 0.6;
      const waiting = Math.random() > 0.7;
      const tags = [...envTags];

      if (idle) tags.push("Idle");
      if (waiting) tags.push("Waiting");
      if (timeOfDay === "morning") tags.push("Morning");
      if (timeOfDay === "evening") tags.push("Evening");
      if (lastLocation && Math.random() > 0.8) tags.push("Location-based");
      tags.push(mood);

      return { timeOfDay, tags, coords: lastLocation, mood };
    };

    const pickLessonForContext = (context: Context): Lesson | null => {
      const candidates = LESSONS.filter((lesson) =>
        lesson.tags.some((tag) => 
          context.tags.includes(tag) || profile.skills.includes(tag)
        )
      );
      
      const weightedCandidates = candidates.map(lesson => ({
        lesson,
        weight: 1 / ((lessonsSeen[lesson.id] || 0) + 1)
      }));

      if (weightedCandidates.length > 0) {
        const totalWeight = weightedCandidates.reduce((sum, { weight }) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const { lesson, weight } of weightedCandidates) {
          if (random < weight) return lesson;
          random -= weight;
        }
      }

      return LESSONS[Math.floor(Math.random() * LESSONS.length)];
    };

    const enqueueLesson = (lesson: Lesson, context: Context) => {
      setQueue((currentQueue) => {
        if (currentQueue.length >= 5) return currentQueue;
        if (currentQueue.some((item) => item.id === lesson.id)) {
          return currentQueue;
        }
        
        const newItem: LessonItem = {
          ...lesson,
          triggeredAt: Date.now(),
          context,
        };
        
        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), 1000);
        
        showNotification(`${lesson.title} added to queue!`);
        
        return [newItem, ...currentQueue];
      });
      
      setLastTrigger({ lessonId: lesson.id, at: Date.now() });
    };

    const ambientTick = () => {
      const context = buildSimulatedContext();
      const lesson = pickLessonForContext(context);
      if (lesson) {
        enqueueLesson(lesson, context);
      }
    };

    if (ambientOn) {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLastLocation({
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            });
          },
          () => {
            // Silently handle geolocation errors
          }
        );
      }

      ambientIntervalRef.current = window.setInterval(ambientTick, 15000);
    } else {
      if (ambientIntervalRef.current) {
        window.clearInterval(ambientIntervalRef.current);
        ambientIntervalRef.current = null;
      }
    }

    return () => {
      if (ambientIntervalRef.current) {
        window.clearInterval(ambientIntervalRef.current);
      }
    };
  }, [ambientOn, envTags, profile.skills, lessonsSeen, lastLocation]);

  // ============== HANDLERS ==============
  const showNotification = useCallback((message: string) => {
    setNotificationMessage(message);
    setIsNotificationVisible(true);
    setTimeout(() => setIsNotificationVisible(false), 3000);
  }, []);

  const showLesson = useCallback((lesson: LessonItem) => {
    setCurrentLesson(lesson);
    setLessonsSeen((prev) => ({
      ...prev,
      [lesson.id]: (prev[lesson.id] || 0) + 1,
    }));
    setProfile((p) => ({
      ...p,
      xp: p.xp + lesson.xp,
      streak: p.streak + 1,
    }));
    setXpGained(lesson.xp);
    setQueue((q) => q.filter((x) => x.id !== lesson.id));
    showNotification(`+${lesson.xp} XP earned!`);
  }, [showNotification]);

  const dismissLesson = useCallback(() => {
    setCurrentLesson(null);
  }, []);

  const manualTrigger = useCallback((tag: string) => {
    const context: Context = {
      tags: [tag, "Manual"],
      timeOfDay: "manual",
      coords: lastLocation,
      mood: getMood(),
    };
    
    const relevantLessons = LESSONS.filter((l) => 
      l.tags.includes(tag) || profile.skills.includes(tag)
    );
    
    const lesson = relevantLessons.length > 0 
      ? relevantLessons[Math.floor(Math.random() * relevantLessons.length)]
      : LESSONS[Math.floor(Math.random() * LESSONS.length)];
    
    if (lesson) {
      setQueue((currentQueue) => {
        if (currentQueue.some((item) => item.id === lesson.id)) {
          return currentQueue;
        }
        
        const newItem: LessonItem = {
          ...lesson,
          triggeredAt: Date.now(),
          context,
        };
        
        return [newItem, ...currentQueue].slice(0, 5);
      });
      
      setLastTrigger({ lessonId: lesson.id, at: Date.now() });
      showNotification(`Triggered ${tag} learning!`);
    }
  }, [lastLocation, profile.skills, showNotification]);

  const resetDemo = useCallback(() => {
    setProfile(INITIAL_PROFILE);
    setLessonsSeen({});
    setQueue([]);
    setCurrentLesson(null);
    setEnvTags(["Focus", "Learning", "Wellness"]);
    localStorage.clear();
    showNotification("Demo reset!");
  }, [showNotification]);

  const addEnvTag = useCallback((tag: string) => {
    if (tag.trim() && !envTags.includes(tag.trim())) {
      setEnvTags((current) => [tag.trim(), ...current]);
      showNotification(`Added tag: ${tag.trim()}`);
    }
  }, [envTags, showNotification]);

  const removeEnvTag = useCallback((tag: string) => {
    setEnvTags((current) => current.filter((t) => t !== tag));
  }, []);

  const handleMarkDone = useCallback(() => {
    if (currentLesson) {
      setProfile((p) => ({
        ...p,
        xp: p.xp + currentLesson.xp,
      }));
      showNotification(`Completed: ${currentLesson.title}`);
      dismissLesson();
    }
  }, [currentLesson, dismissLesson, showNotification]);

  const toggleAmbientMode = useCallback(() => {
    setAmbientOn(!ambientOn);
    showNotification(ambientOn ? "Ambient mode paused" : "Ambient mode active!");
  }, [ambientOn, showNotification]);

  // ============== COMPUTED VALUES ==============
  const levelInfo = useMemo(() => xpToLevel(profile.xp), [profile.xp]);
  
  const allTags = useMemo(() => 
    Array.from(new Set(LESSONS.flatMap((l) => l.tags))), 
    []
  );

  const popularTags = useMemo(() => 
    allTags.slice(0, 6), 
    [allTags]
  );

  // ============== RENDER ==============
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-4 md:p-8 overflow-hidden">
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.5); }
          50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.8); }
        }
        
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes fade-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        
        .animate-fade-up {
          animation: fade-up 0.5s ease-out;
        }
        
        .pulse-glow {
          animation: pulse-glow 2s infinite;
        }
      `}</style>

      <div className="max-w-7xl mx-auto relative">
        <FloatingParticles active={ambientOn} />
        
        {/* XP Gain Notification */}
        {xpGained > 0 && (
          <div className="fixed top-8 right-8 z-50 animate-fade-up">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full blur-lg opacity-60" />
              <div className="relative px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl shadow-xl">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-amber-600" />
                  <div>
                    <div className="font-bold text-amber-900">+{xpGained} XP!</div>
                    <div className="text-sm text-amber-700">Great progress!</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notification */}
        {isNotificationVisible && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-slide-in">
            <div className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full shadow-lg flex items-center gap-3">
              <Bell className="w-5 h-5" />
              <span className="font-medium">{notificationMessage}</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
              AmbientSkillSync
            </h1>
            <p className="text-gray-600 mt-2">Micro-learning that adapts to your context</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className={`w-4 h-4 rounded-full ${ambientOn ? 'bg-green-400 pulse-glow' : 'bg-gray-400'} absolute -top-1 -right-1`} />
              <button
                onClick={toggleAmbientMode}
                className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-3 ${
                  ambientOn
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gradient-to-r from-gray-200 to-gray-100 text-gray-700 hover:from-gray-300 hover:to-gray-200'
                }`}
              >
                {ambientOn ? (
                  <>
                    <Pause className="w-5 h-5" />
                    Pause Ambient
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Start Ambient
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Left Column - Profile */}
          <div className="lg:col-span-1 space-y-8">
            {/* Profile Card */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6 shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl">
                    AC
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs px-2 py-1 rounded-full">
                    Lvl {levelInfo.level}
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
                  <p className="text-sm text-gray-600">Continuous Learner</p>
                  <div className="flex items-center gap-2 mt-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">Learning now</span>
                  </div>
                </div>
              </div>

              <XPProgressBar xp={profile.xp} />
              
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-5 h-5 text-blue-500" />
                  <h3 className="font-semibold text-gray-900">Active Skills</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100 hover:border-blue-300 transition-colors"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Streak & Stats */}
            <StreakBadge streak={profile.streak} />

            {/* Environment Tags */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-gray-900">Environment Tags</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a context tag..."
                    className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addEnvTag((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = "";
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = (e.currentTarget.previousSibling as HTMLInputElement);
                      addEnvTag(input.value);
                      input.value = "";
                    }}
                    className="px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg"
                  >
                    Add
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {envTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 rounded-lg text-sm"
                    >
                      <span>{tag}</span>
                      <button
                        onClick={() => removeEnvTag(tag)}
                        className="text-purple-900 hover:text-purple-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <button
                onClick={resetDemo}
                className="w-full px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 rounded-xl font-medium hover:from-gray-200 hover:to-gray-100 transition-all duration-300 hover:shadow-md"
              >
                Reset Demo
              </button>
            </div>
          </div>

          {/* Middle & Right Columns */}
          <div className="lg:col-span-3 space-y-8">
            {/* Queue & Triggers Row */}
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Queue */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className={`w-3 h-3 rounded-full ${ambientOn ? 'bg-green-400 animate-pulse' : 'bg-gray-400'} absolute -top-1 -right-1`} />
                        <BookOpen className="w-6 h-6 text-blue-500" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900">Learning Queue</h2>
                    </div>
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                      {queue.length} items
                    </span>
                  </div>

                  <div className="space-y-4">
                    {queue.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-2xl">
                        <div className="text-6xl mb-4 opacity-20">📚</div>
                        <p className="text-gray-500">Queue is empty</p>
                        <p className="text-sm text-gray-400 mt-1">Add lessons or enable ambient mode</p>
                      </div>
                    ) : (
                      queue.map((item) => (
                        <QueueItem
                          key={item.id}
                          item={item}
                          onOpen={() => showLesson(item)}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Triggers */}
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-6">
                  <Zap className="w-6 h-6 text-amber-500" />
                  <h3 className="text-xl font-bold text-gray-900">Quick Triggers</h3>
                </div>

                <p className="text-gray-600 mb-6 text-sm">
                  Simulate different contexts to trigger relevant micro-lessons
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {popularTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => manualTrigger(tag)}
                      className="p-4 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-300 group"
                    >
                      <div className="text-lg mb-2 opacity-70 group-hover:opacity-100">
                        {LESSONS.find(l => l.tags.includes(tag))?.icon || "💡"}
                      </div>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                        {tag}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-500 mb-3">Recent Activity</div>
                  {lastTrigger && (
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">
                        {new Date(lastTrigger.at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      <span className="text-gray-500">• Lesson added</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lesson Library */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Star className="w-6 h-6 text-purple-500" />
                  <h2 className="text-2xl font-bold text-gray-900">Micro-Lesson Library</h2>
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>

              <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {LESSONS.map((lesson) => (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    onOpen={() => showLesson({ ...lesson })}
                    onEnqueue={() => manualTrigger(lesson.tags[0])}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Lesson Modal */}
      {currentLesson && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300 z-40"
            onClick={dismissLesson}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="relative w-full max-w-2xl animate-fade-up">
              <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl" />
              <div className="relative p-8">
                <button
                  onClick={dismissLesson}
                  className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-4 mb-6">
                  <div className={`text-5xl ${currentLesson.color.split(' ')[0]}`}>
                    {currentLesson.icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{currentLesson.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-sm font-bold">
                        +{currentLesson.xp} XP
                      </div>
                      <span className="text-sm text-gray-500">Micro-lesson</span>
                    </div>
                  </div>
                </div>

                <div className="prose prose-lg max-w-none mb-8">
                  <p className="text-gray-700 leading-relaxed text-lg">{currentLesson.text}</p>
                </div>

                <div className="flex flex-wrap gap-3 mb-8">
                  {currentLesson.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 rounded-xl text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleMarkDone}
                    className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-3"
                  >
                    <Check className="w-5 h-5" />
                    Complete & Earn XP
                  </button>
                  <button
                    onClick={dismissLesson}
                    className="px-8 py-4 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 font-medium rounded-xl hover:from-gray-200 hover:to-gray-100 transition-colors"
                  >
                    Save for Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}