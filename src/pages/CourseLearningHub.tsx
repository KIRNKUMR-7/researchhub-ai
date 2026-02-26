import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    GraduationCap, BookOpen, ChevronRight, ChevronLeft,
    CheckCircle, XCircle, Trophy, RefreshCw, Loader2, Youtube,
    FileText, Brain, Star, Clock
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../contexts/AuthContext";
import { quizDb } from "../lib/db";
import { sendToGemini } from "../lib/gemini";

interface Course {
    id: string;
    title: string;
    topic: string;
    duration: string;
    difficulty: "Beginner" | "Intermediate" | "Advanced";
    color: string;
    youtubeId: string;
    description: string;
    tags: string[];
    notes: string[];
}

interface QuizQuestion {
    question: string;
    options: string[];
    answer: number;
    explanation: string;
}

const COURSES: Course[] = [
    {
        id: "transformers",
        title: "Transformer Architecture Deep Dive",
        topic: "Attention Mechanism & Transformers",
        duration: "2 hrs",
        difficulty: "Intermediate",
        color: "211 100% 50%",
        youtubeId: "4Bdc55j80l8",
        description: "Master the self-attention mechanism, multi-head attention, positional encoding, and encoder-decoder architecture powering modern AI.",
        tags: ["Transformers", "NLP", "Attention"],
        notes: [
            "**Self-Attention**: Each token attends to every other token in the sequence to build contextual representations.",
            "**Multi-Head Attention**: Run attention `h` times in parallel with different learned projections, concatenate results.",
            "**Positional Encoding**: Sine/cosine functions inject position info since attention is permutation-invariant.",
            "**Encoder-Decoder**: Encoder maps input to latent space; decoder generates output attending to encoder output.",
            "**Feed-Forward Layers**: Two linear layers with ReLU/GELU applied identically to each position independently.",
            "**Layer Normalization**: Applied before (Pre-LN) or after (Post-LN) each sub-layer to stabilize training.",
            "**Complexity**: Self-attention is O(n²·d) — quadratic in sequence length, but fully parallelizable unlike RNNs.",
        ],
    },
    {
        id: "rag",
        title: "Retrieval-Augmented Generation",
        topic: "RAG Pipelines & Vector Search",
        duration: "25 min",
        difficulty: "Intermediate",
        color: "142 71% 45%",
        youtubeId: "T-D1OfcDW1M",
        description: "Learn to augment LLMs with external knowledge using vector databases, embedding models, and retrieval pipelines to eliminate hallucinations.",
        tags: ["RAG", "Vector DB", "LLMs"],
        notes: [
            "**RAG = Retrieval + Generation**: Retrieve relevant documents, prepend them to context, then generate a grounded response.",
            "**Embedding Models**: Text is encoded into dense vectors that capture semantic meaning (e.g., `text-embedding-3-small`).",
            "**Vector Databases**: Store and index embeddings for fast approximate nearest-neighbor search (FAISS, Pinecone, Weaviate).",
            "**Chunking Strategy**: Split documents into overlapping chunks (e.g., 512 tokens, 50 overlap) before embedding.",
            "**Retrieval**: At query time, embed the question and find top-k most similar document chunks using cosine similarity.",
            "**Context Window**: Retrieved chunks are injected into the LLM prompt as additional context before generation.",
            "**Re-ranking**: Optional step to re-score retrieved docs using a cross-encoder for higher precision.",
        ],
    },
    {
        id: "diffusion",
        title: "Diffusion Models & Stable Diffusion",
        topic: "Generative AI & Image Synthesis",
        duration: "30 min",
        difficulty: "Advanced",
        color: "280 70% 60%",
        youtubeId: "1CIpzeNxIhU",
        description: "Understand DDPM, DDIM, score matching, and how Stable Diffusion uses latent space to generate photorealistic images from text prompts.",
        tags: ["Diffusion", "Generative AI", "Image Synthesis"],
        notes: [
            "**Forward Process**: Gradually add Gaussian noise to an image over T timesteps until it becomes pure random noise.",
            "**Reverse Process**: Train a neural network (U-Net) to predict and remove noise at each timestep.",
            "**DDPM**: Denoising Diffusion Probabilistic Models — the foundational paper by Ho et al. (2020).",
            "**DDIM**: Deterministic sampling allows faster inference (50 steps vs 1000) with comparable quality.",
            "**Score Matching**: Alternative formulation — train a network to estimate the gradient of the log-density of the data.",
            "**Latent Diffusion (Stable Diffusion)**: Compresses images with a VAE first, then runs diffusion in the latent space.",
            "**Text Conditioning**: CLIP text embeddings are injected via cross-attention layers in the U-Net for text-to-image generation.",
        ],
    },
    {
        id: "rlhf",
        title: "RLHF & AI Alignment",
        topic: "Reinforcement Learning from Human Feedback",
        duration: "30 min",
        difficulty: "Advanced",
        color: "0 100% 44%",
        youtubeId: "2MBJOuVq380",
        description: "Learn how OpenAI, Anthropic, and DeepMind train safe, helpful AI using preference data, reward models, and PPO.",
        tags: ["RLHF", "Alignment", "PPO"],
        notes: [
            "**Step 1 — SFT**: Fine-tune a pretrained LLM on high-quality human demonstrations (Supervised Fine-Tuning).",
            "**Step 2 — Reward Model**: Train a separate model to predict human preferences given pairs of model outputs.",
            "**Step 3 — PPO**: Use Proximal Policy Optimization to update the SFT model to maximize reward model scores.",
            "**KL Penalty**: Add KL divergence penalty vs the reference SFT model to prevent reward hacking and collapse.",
            "**Constitutional AI**: Anthropic's extension using AI-generated critiques instead of human preference labels.",
            "**DPO**: Direct Preference Optimization — eliminates the reward model, directly optimizes the policy on preference data.",
            "**Challenges**: Reward hacking, distribution shift, feedback quality, and scalable oversight are open problems.",
        ],
    },
    {
        id: "bert-gpt",
        title: "BERT vs GPT: Encoder vs Decoder",
        topic: "Pre-trained Language Models",
        duration: "20 min",
        difficulty: "Beginner",
        color: "36 100% 50%",
        youtubeId: "xI0HHN5XKDo",
        description: "Understand the key architectural differences between encoder-only (BERT), decoder-only (GPT), and encoder-decoder (T5) models.",
        tags: ["BERT", "GPT", "NLP", "Pre-training"],
        notes: [
            "**BERT (Encoder-only)**: Bidirectional — sees context from both directions. Best for classification, NER, and QA tasks.",
            "**GPT (Decoder-only)**: Causal/autoregressive — only sees left context. Best for text generation and conversational AI.",
            "**MLM**: BERT trained with Masked Language Modeling — predict randomly masked tokens using bidirectional context.",
            "**CLM**: GPT trained with Causal Language Modeling — predict the next token given all previous tokens.",
            "**T5 (Encoder-Decoder)**: Converts every NLP task to text-to-text format. Balances BERT and GPT capabilities.",
            "**Fine-tuning**: Add a task-specific head on top of pre-trained representations and fine-tune on labeled data.",
            "**Scale Dominance**: At scale, causal LMs (GPT-4, LLaMA 2, Mistral) now outperform BERT-style models on most tasks.",
        ],
    },
    {
        id: "llm-evaluation",
        title: "LLM Evaluation & Benchmarking",
        topic: "Measuring AI Capabilities",
        duration: "15 min",
        difficulty: "Beginner",
        color: "200 75% 50%",
        youtubeId: "GKzInOwhRwQ",
        description: "Explore how to rigorously evaluate large language models using MMLU, HumanEval, BIG-Bench, and LLM-as-judge approaches.",
        tags: ["Evaluation", "Benchmarks", "LLMs"],
        notes: [
            "**MMLU**: Massive Multitask Language Understanding — 57 subjects from STEM to humanities, tests knowledge breadth.",
            "**HumanEval**: Tests functional code generation — 164 hand-written programming problems with unit test evaluation.",
            "**HellaSwag**: Commonsense NLI — choose the most plausible sentence continuation from 4 adversarial options.",
            "**BIG-Bench**: 200+ diverse tasks designed to be beyond current model capabilities at time of publication.",
            "**LLM-as-Judge**: Use a strong model (GPT-4) to evaluate outputs on helpfulness, harmlessness, and quality.",
            "**Contamination Risk**: Training data leakage can inflate benchmark scores — critical to screen for test set overlap.",
            "**Chatbot Arena**: ELO ratings from blind human comparisons — considered the gold standard for real-world chat quality.",
        ],
    },
    {
        id: "vector-embeddings",
        title: "Vector Embeddings & Semantic Search",
        topic: "Embeddings, FAISS & Similarity Search",
        duration: "20 min",
        difficulty: "Intermediate",
        color: "150 70% 45%",
        youtubeId: "ySus5ZS0b94",
        description: "Deep dive into how neural networks encode meaning into vector spaces, and how vector databases enable semantic search at scale.",
        tags: ["Embeddings", "Vector DB", "Semantic Search"],
        notes: [
            "**Word2Vec**: Learn word vectors by predicting surrounding words (Skip-gram) or centre word (CBOW).",
            "**Sentence Embeddings**: Models like `sentence-transformers` encode entire sentences into fixed-size dense vectors.",
            "**Cosine Similarity**: Measure similarity: `sim(A,B) = A·B / (|A||B|)` — range [-1, 1], higher means more similar.",
            "**FAISS**: Facebook AI Similarity Search — C++ library enabling efficient billion-scale vector search.",
            "**HNSW**: Hierarchical Navigable Small World graphs — the dominant algorithm for approximate nearest-neighbor search.",
            "**Dimensionality**: OpenAI `ada-002` uses 1536 dims; `text-embedding-3-small` supports variable dimensions (512–1536).",
            "**Hybrid Search**: Combine dense vector search with sparse BM25 keyword search using Reciprocal Rank Fusion (RRF).",
        ],
    },
    {
        id: "multimodal",
        title: "Multimodal AI: Vision-Language Models",
        topic: "CLIP, GPT-4V, Gemini Vision",
        duration: "35 min",
        difficulty: "Advanced",
        color: "252 100% 67%",
        youtubeId: "OZF1t_Hieq8",
        description: "Understand contrastive learning (CLIP), visual instruction tuning (LLaVA), and how GPT-4V and Gemini process images with text.",
        tags: ["Multimodal", "CLIP", "Vision", "LLMs"],
        notes: [
            "**CLIP**: Trained on 400M image-text pairs using contrastive loss — aligns vision and language in a shared embedding space.",
            "**Zero-Shot Classification**: CLIP can classify any image by comparing its embedding to text prompt embeddings — no fine-tuning needed.",
            "**LLaVA (Visual Instruction Tuning)**: Fine-tune LLM on multimodal instruction data using a CLIP visual encoder projection.",
            "**GPT-4V**: OpenAI's native multimodal GPT-4 — processes interleaved image/text inputs, achieving human-level vision QA.",
            "**Gemini**: Google's natively multimodal model trained jointly on text, code, images, audio, and video from the ground up.",
            "**Image Tokens**: Images encoded as a grid of patch embeddings (ViT), then projected into the LLM's token embedding space.",
            "**Multimodal Tasks**: Spatial reasoning, OCR, chart reading, diagram understanding are key benchmarks for VLMs.",
        ],
    },
];

const DIFFICULTY_COLOR: Record<string, string> = {
    Beginner: "text-success",
    Intermediate: "text-warning",
    Advanced: "text-red-400",
};

function renderNote(note: string) {
    const parts = note.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={i} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
            return <code key={i} className="px-1 py-0.5 rounded text-xs bg-primary/10 text-primary font-mono">{part.slice(1, -1)}</code>;
        }
        return <span key={i}>{part}</span>;
    });
}

const CourseLearningHub = () => {
    const { user } = useAuth();
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
    const [quizLoading, setQuizLoading] = useState(false);
    const [quizError, setQuizError] = useState("");
    const [userAnswers, setUserAnswers] = useState<number[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [bestScores, setBestScores] = useState<Record<string, number>>({});

    useEffect(() => {
        if (!user) return;
        const scores: Record<string, number> = {};
        COURSES.forEach(c => {
            const best = quizDb.bestScore(user.id, c.id);
            if (best) scores[c.id] = best.score;
        });
        setBestScores(scores);
    }, [user?.id]);

    const generateQuiz = async (course: Course) => {
        setQuizLoading(true);
        setQuizError("");
        setQuizQuestions([]);
        try {
            const prompt = `Generate exactly 5 multiple-choice quiz questions about "${course.title}" (topic: ${course.topic}).

Return ONLY a valid JSON array — no markdown, no extra text:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": 0,
    "explanation": "Brief explanation of why the correct answer is correct."
  }
]

Rules: "answer" is 0-based index of the correct option. One correct answer per question. Keep options under 15 words.`;
            const raw = await sendToGemini([], prompt);
            const jsonMatch = raw.match(/\[[\s\S]*\]/);
            if (!jsonMatch) throw new Error("Invalid format");
            const parsed: QuizQuestion[] = JSON.parse(jsonMatch[0]);
            if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Empty");
            setQuizQuestions(parsed.slice(0, 5));
            setUserAnswers(new Array(Math.min(parsed.length, 5)).fill(-1));
        } catch {
            setQuizError("Couldn't generate quiz. Please check your connection and try again.");
        } finally {
            setQuizLoading(false);
        }
    };

    const loadCourse = (course: Course) => {
        setSelectedCourse(course);
        setUserAnswers([]);
        setSubmitted(false);
        setScore(0);
        setQuizError("");
        generateQuiz(course);
    };

    const handleAnswer = (qIdx: number, optIdx: number) => {
        if (submitted) return;
        setUserAnswers(prev => { const n = [...prev]; n[qIdx] = optIdx; return n; });
    };

    const handleSubmit = () => {
        if (!user || !selectedCourse) return;
        const correct = quizQuestions.reduce((acc, q, i) => acc + (userAnswers[i] === q.answer ? 1 : 0), 0);
        setScore(correct);
        setSubmitted(true);
        quizDb.save({
            userId: user.id,
            courseId: selectedCourse.id,
            courseTitle: selectedCourse.title,
            score: correct,
            total: quizQuestions.length,
            completedAt: new Date().toISOString(),
        });
        setBestScores(prev => ({ ...prev, [selectedCourse.id]: Math.max(prev[selectedCourse.id] ?? 0, correct) }));
    };

    const retakeQuiz = () => {
        setUserAnswers(new Array(quizQuestions.length).fill(-1));
        setSubmitted(false);
        setScore(0);
    };

    const answeredCount = userAnswers.filter(a => a !== -1).length;
    const allAnswered = answeredCount === quizQuestions.length && quizQuestions.length > 0;
    const pct = quizQuestions.length > 0 ? Math.round((score / quizQuestions.length) * 100) : 0;

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
                        <GraduationCap className="w-8 h-8 text-primary" />
                        <span><span className="glow-text">Course</span> Learning Hub</span>
                    </h1>
                    <p className="text-muted-foreground mt-1">Master AI & ML with curated notes, video lectures, and AI-powered quizzes.</p>
                </motion.div>

                {!selectedCourse ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {COURSES.map((course, i) => {
                            const hasBest = bestScores[course.id] !== undefined;
                            const diffColors: Record<string, string> = {
                                Beginner: "rgba(52,199,89,0.9)",
                                Intermediate: "rgba(255,159,10,0.9)",
                                Advanced: "rgba(255,59,48,0.9)",
                            };
                            return (
                                <motion.div
                                    key={course.id}
                                    className="relative cursor-pointer group overflow-hidden"
                                    style={{
                                        borderRadius: 24,
                                        background: `linear-gradient(145deg, hsl(${course.color} / 0.92), hsl(${course.color} / 0.7))`,
                                        boxShadow: `0 8px 32px hsl(${course.color} / 0.30), 0 2px 8px hsl(${course.color} / 0.18)`,
                                        minHeight: 220,
                                    }}
                                    initial={{ opacity: 0, y: 24, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ delay: i * 0.08, type: "spring", damping: 20, stiffness: 240 }}
                                    whileHover={{ y: -6, scale: 1.02, boxShadow: `0 16px 48px hsl(${course.color} / 0.42), 0 4px 16px hsl(${course.color} / 0.26)` }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => loadCourse(course)}
                                >
                                    {/* Moving shine overlay on hover */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.12) 100%)" }} />

                                    {/* Large floating background icon */}
                                    <div className="absolute -bottom-6 -right-6 opacity-[0.12] pointer-events-none">
                                        <BookOpen style={{ width: 130, height: 130, color: "#fff" }} />
                                    </div>

                                    {/* Top row: best score badge */}
                                    <div className="absolute top-4 right-4">
                                        {hasBest ? (
                                            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
                                                style={{ background: "rgba(255,255,255,0.25)", backdropFilter: "blur(12px)", color: "#fff" }}>
                                                <Star className="w-3 h-3" /> {bestScores[course.id]}/5
                                            </div>
                                        ) : null}
                                    </div>

                                    {/* Content */}
                                    <div className="relative z-10 p-5 h-full flex flex-col">
                                        {/* Icon circle */}
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-auto"
                                            style={{ background: "rgba(255,255,255,0.22)", backdropFilter: "blur(12px)" }}>
                                            <BookOpen className="w-6 h-6 text-white" />
                                        </div>

                                        {/* Title */}
                                        <div className="mt-10">
                                            <h3 className="font-bold text-sm leading-snug text-white" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.15)" }}>
                                                {course.title}
                                            </h3>
                                            <p className="text-[11px] mt-1.5 line-clamp-2 leading-relaxed" style={{ color: "rgba(255,255,255,0.78)" }}>
                                                {course.description}
                                            </p>
                                        </div>

                                        {/* Bottom meta row */}
                                        <div className="flex items-center gap-2 mt-4">
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                                style={{ background: diffColors[course.difficulty], color: "#fff", backdropFilter: "blur(8px)" }}>
                                                {course.difficulty}
                                            </span>
                                            <span className="flex items-center gap-1 text-[11px] font-medium"
                                                style={{ color: "rgba(255,255,255,0.72)" }}>
                                                <Clock className="w-3 h-3" /> {course.duration}
                                            </span>
                                            <div className="ml-auto">
                                                <div className="w-7 h-7 rounded-xl flex items-center justify-center group-hover:translate-x-0.5 transition-transform"
                                                    style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)" }}>
                                                    <ChevronRight className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <button onClick={() => setSelectedCourse(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors group">
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> All Courses
                        </button>

                        {/* Course Header */}
                        <div className="glass-card p-6 mb-6">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `hsl(${selectedCourse.color} / 0.15)` }}>
                                    <GraduationCap className="w-7 h-7" style={{ color: `hsl(${selectedCourse.color})` }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-2xl font-display font-bold text-foreground">{selectedCourse.title}</h2>
                                    <p className="text-muted-foreground mt-1 text-sm">{selectedCourse.description}</p>
                                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                                        <span className={`text-xs font-semibold ${DIFFICULTY_COLOR[selectedCourse.difficulty]}`}>{selectedCourse.difficulty}</span>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {selectedCourse.duration}</span>
                                        {selectedCourse.tags.map(tag => <span key={tag} className="mac-tag">{tag}</span>)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes + Video */}
                        <div className="grid lg:grid-cols-2 gap-6 mb-8">
                            <motion.div className="glass-card p-6" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                                <h3 className="font-display font-semibold text-foreground flex items-center gap-2 mb-5">
                                    <FileText className="w-5 h-5 text-primary" /> Course Notes
                                </h3>
                                <ul className="space-y-3">
                                    {selectedCourse.notes.map((note, i) => (
                                        <motion.li key={i} className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.06 }}>
                                            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold text-white" style={{ background: `hsl(${selectedCourse.color})` }}>{i + 1}</div>
                                            <span>{renderNote(note)}</span>
                                        </motion.li>
                                    ))}
                                </ul>
                            </motion.div>

                            <motion.div className="glass-card p-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                                <h3 className="font-display font-semibold text-foreground flex items-center gap-2 mb-4">
                                    <Youtube className="w-5 h-5 text-red-400" /> Video Lecture
                                </h3>
                                <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingBottom: "56.25%" }}>
                                    <iframe
                                        src={`https://www.youtube.com/embed/${selectedCourse.youtubeId}?rel=0&modestbranding=1`}
                                        title={selectedCourse.title}
                                        className="absolute inset-0 w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-3 text-center">Watch the lecture, then test yourself with the AI quiz below ↓</p>
                            </motion.div>
                        </div>

                        {/* AI Quiz */}
                        <motion.div className="glass-card p-6" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                            <h3 className="font-display font-semibold text-foreground flex items-center gap-2 mb-2">
                                <Brain className="w-5 h-5 text-primary" /> AI-Generated Quiz
                                <span className="ml-auto text-xs text-muted-foreground font-normal">Powered by DeepSeek AI</span>
                            </h3>
                            <p className="text-sm text-muted-foreground mb-6">Test your understanding of <span className="text-foreground font-medium">{selectedCourse.title}</span>.</p>

                            {quizLoading && (
                                <div className="flex flex-col items-center justify-center py-16 gap-4">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `hsl(${selectedCourse.color} / 0.15)` }}>
                                            <Brain className="w-8 h-8" style={{ color: `hsl(${selectedCourse.color})` }} />
                                        </div>
                                        <Loader2 className="w-6 h-6 text-primary animate-spin absolute -bottom-1 -right-1" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-foreground">Generating your quiz...</p>
                                        <p className="text-xs text-muted-foreground mt-1">AI is crafting 5 personalized questions</p>
                                    </div>
                                </div>
                            )}

                            {quizError && (
                                <div className="flex flex-col items-center py-8 gap-3">
                                    <p className="text-sm text-destructive">{quizError}</p>
                                    <button onClick={() => generateQuiz(selectedCourse)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-sm text-foreground transition-colors">
                                        <RefreshCw className="w-4 h-4" /> Retry
                                    </button>
                                </div>
                            )}

                            {submitted && (
                                <motion.div className="mb-8 p-6 rounded-2xl text-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, hsl(${selectedCourse.color} / 0.15), hsl(${selectedCourse.color} / 0.05))`, border: `1px solid hsl(${selectedCourse.color} / 0.3)` }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", damping: 15 }}>
                                    <Trophy className="w-10 h-10 mx-auto mb-3" style={{ color: `hsl(${selectedCourse.color})` }} />
                                    <motion.div className="text-5xl font-display font-black mb-1" style={{ color: `hsl(${selectedCourse.color})` }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}>
                                        {pct}%
                                    </motion.div>
                                    <p className="text-lg font-semibold text-foreground">{score} / {quizQuestions.length} Correct</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {pct >= 80 ? "🎉 Excellent! You've mastered this topic." : pct >= 60 ? "👍 Good effort. Review the notes and try again!" : "📚 Keep studying! Check the course notes above."}
                                    </p>
                                    <button onClick={retakeQuiz} className="mt-4 flex items-center gap-2 px-5 py-2 rounded-lg bg-background/50 text-sm font-medium text-foreground hover:bg-background/70 transition-colors mx-auto">
                                        <RefreshCw className="w-4 h-4" /> Retake Quiz
                                    </button>
                                </motion.div>
                            )}

                            {!quizLoading && quizQuestions.length > 0 && (
                                <div className="space-y-6">
                                    {quizQuestions.map((q, qi) => (
                                        <motion.div key={qi} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: qi * 0.08 }}>
                                            <p className="text-sm font-semibold text-foreground mb-3">
                                                <span className="text-primary mr-2">Q{qi + 1}.</span>{q.question}
                                            </p>
                                            <div className="grid sm:grid-cols-2 gap-2">
                                                {q.options.map((opt, oi) => {
                                                    const isSelected = userAnswers[qi] === oi;
                                                    const isCorrect = oi === q.answer;
                                                    const isWrong = submitted && isSelected && !isCorrect;
                                                    const showCorrect = submitted && isCorrect;
                                                    return (
                                                        <button
                                                            key={oi}
                                                            onClick={() => handleAnswer(qi, oi)}
                                                            disabled={submitted}
                                                            className={`px-4 py-3 rounded-xl text-sm text-left transition-all border font-medium ${showCorrect ? "border-success/50 bg-success/10 text-success" : isWrong ? "border-destructive/50 bg-destructive/10 text-destructive" : isSelected ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-secondary/50 text-muted-foreground hover:border-border/80 hover:text-foreground hover:bg-secondary"}`}
                                                        >
                                                            <span className="flex items-center gap-2">
                                                                <span className="w-5 h-5 rounded-full border flex items-center justify-center text-xs flex-shrink-0" style={{ borderColor: showCorrect ? "hsl(142 71% 45%)" : isWrong ? "hsl(0 100% 44%)" : isSelected ? "hsl(211 100% 50%)" : "hsl(0 0% 30%)" }}>
                                                                    {["A", "B", "C", "D"][oi]}
                                                                </span>
                                                                {opt}
                                                                {showCorrect && <CheckCircle className="w-4 h-4 ml-auto flex-shrink-0" />}
                                                                {isWrong && <XCircle className="w-4 h-4 ml-auto flex-shrink-0" />}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {submitted && (
                                                <motion.div className="mt-2 px-4 py-2.5 rounded-lg bg-primary/5 border border-primary/15 text-xs text-muted-foreground" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                                                    <span className="text-primary font-semibold">Explanation: </span>{q.explanation}
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    ))}
                                    {!submitted && (
                                        <motion.div className="flex items-center justify-between pt-4 border-t border-border" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                                            <span className="text-sm text-muted-foreground">{answeredCount} / {quizQuestions.length} answered</span>
                                            <motion.button
                                                onClick={handleSubmit}
                                                disabled={!allAnswered}
                                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                                                whileHover={allAnswered ? { scale: 1.03 } : {}}
                                                whileTap={allAnswered ? { scale: 0.97 } : {}}
                                            >
                                                <ChevronRight className="w-4 h-4" /> Submit Quiz
                                            </motion.button>
                                        </motion.div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default CourseLearningHub;
