import { useEffect, useRef, useState, useCallback } from "react";
import { useOutletContext } from "react-router";
import Navbar from "../../components/Navbar";
import {
    MessageCircle,
    Send,
    Image as ImageIcon,
    X,
    ChevronUp,
    ChevronDown,
    Hash,
    Users,
    Flame,
    Clock,
    Plus,
} from "lucide-react";
import puter from "@heyputer/puter.js";

export function meta() {
    return [
        { title: "Community – Roomie" },
        { name: "description", content: "Share your floor plan renders with the Roomie community." },
    ];
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface Post {
    id: string;
    authorName: string;
    authorId: string;
    text: string;
    imageUrl?: string;
    timestamp: number;
    votes: number;
    commentCount: number;
    tags?: string[];
}

interface Comment {
    id: string;
    postId: string;
    authorName: string;
    authorId: string;
    text: string;
    timestamp: number;
}

// ─── Puter KV helpers ────────────────────────────────────────────────────────

const KV_POSTS_INDEX = "roomie_community_posts_index_v2";
const KV_POST_PREFIX = "roomie_community_post_v2_";
const KV_COMMENTS_PREFIX = "roomie_community_comments_v2_";

async function kvGet<T>(key: string): Promise<T | null> {
    try {
        const val = await puter.kv.get(key);
        return val as T | null;
    } catch {
        return null;
    }
}

async function kvSet(key: string, value: unknown) {
    try {
        await puter.kv.set(key, value);
    } catch {}
}

async function loadPosts(): Promise<Post[]> {
    const index = (await kvGet<string[]>(KV_POSTS_INDEX)) ?? [];
    const posts: Post[] = [];
    for (const id of index) {
        const p = await kvGet<Post>(`${KV_POST_PREFIX}${id}`);
        if (p) posts.push(p);
    }
    return posts.sort((a, b) => b.timestamp - a.timestamp);
}

async function savePost(post: Post) {
    const index = (await kvGet<string[]>(KV_POSTS_INDEX)) ?? [];
    if (!index.includes(post.id)) {
        await kvSet(KV_POSTS_INDEX, [post.id, ...index]);
    }
    await kvSet(`${KV_POST_PREFIX}${post.id}`, post);
}

async function loadComments(postId: string): Promise<Comment[]> {
    return (await kvGet<Comment[]>(`${KV_COMMENTS_PREFIX}${postId}`)) ?? [];
}

async function saveComment(comment: Comment) {
    const existing = await loadComments(comment.postId);
    await kvSet(`${KV_COMMENTS_PREFIX}${comment.postId}`, [...existing, comment]);
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

const COLORS = ["#f97316","#3b82f6","#8b5cf6","#10b981","#ef4444","#f59e0b","#06b6d4","#ec4899"];
function avatarColor(name: string) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return COLORS[Math.abs(h) % COLORS.length];
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
    return (
        <div
            style={{ width: size, height: size, background: avatarColor(name), fontSize: size * 0.38 }}
            className="rounded-full flex items-center justify-center text-white font-bold shrink-0 select-none uppercase"
        >
            {name.slice(0, 2)}
        </div>
    );
}

function TimeAgo({ ts }: { ts: number }) {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    const label = days > 0 ? `${days}d ago` : hrs > 0 ? `${hrs}h ago` : mins > 0 ? `${mins}m ago` : "just now";
    return <span className="text-zinc-400 text-xs font-mono">{label}</span>;
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({
                      post,
                      currentUserId,
                      onComment,
                      onVote,
                  }: {
    post: Post;
    currentUserId: string | null;
    onComment: (post: Post) => void;
    onVote: (postId: string, dir: 1 | -1) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [lightbox, setLightbox] = useState(false);

    return (
        <>
            <article className="bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-200 group">
                <div className="flex">
                    {/* Vote rail */}
                    <div className="flex flex-col items-center gap-1 px-3 py-5 bg-zinc-50 border-r border-zinc-100">
                        <button
                            onClick={() => onVote(post.id, 1)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-primary hover:bg-orange-50 transition-colors"
                        >
                            <ChevronUp size={16} />
                        </button>
                        <span className="text-xs font-bold text-zinc-700 tabular-nums min-w-[1.5rem] text-center leading-none">{post.votes}</span>
                        <button
                            onClick={() => onVote(post.id, -1)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                        >
                            <ChevronDown size={16} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-w-0 p-4 md:p-5">
                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <Avatar name={post.authorName} size={26} />
                            <span className="text-sm font-bold text-zinc-900">{post.authorName}</span>
                            <TimeAgo ts={post.timestamp} />
                            {post.tags?.map((tag) => (
                                <span key={tag} className="px-2 py-0.5 bg-orange-50 text-primary text-[10px] font-bold uppercase tracking-wide rounded-full border border-orange-100">
                                    #{tag}
                                </span>
                            ))}
                        </div>

                        {/* Text */}
                        {post.text && (
                            <p className="text-zinc-800 text-sm leading-relaxed mb-3 whitespace-pre-wrap">
                                {expanded || post.text.length < 300
                                    ? post.text
                                    : post.text.slice(0, 300) + "…"}
                                {post.text.length >= 300 && (
                                    <button
                                        onClick={() => setExpanded((v) => !v)}
                                        className="ml-1 text-primary text-xs font-bold hover:underline"
                                    >
                                        {expanded ? "show less" : "read more"}
                                    </button>
                                )}
                            </p>
                        )}

                        {/* Image */}
                        {post.imageUrl && (
                            <div
                                className="mb-3 rounded-xl overflow-hidden border border-zinc-100 cursor-zoom-in max-h-80"
                                onClick={() => setLightbox(true)}
                            >
                                <img
                                    src={post.imageUrl}
                                    alt="post attachment"
                                    className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
                                />
                            </div>
                        )}

                        {/* Actions */}
                        <button
                            onClick={() => onComment(post)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-primary transition-colors mt-1"
                        >
                            <MessageCircle size={13} />
                            <span>{post.commentCount} comment{post.commentCount !== 1 ? "s" : ""}</span>
                        </button>
                    </div>
                </div>
            </article>

            {/* Lightbox */}
            {lightbox && post.imageUrl && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
                    onClick={() => setLightbox(false)}
                >
                    <button className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20">
                        <X size={16} />
                    </button>
                    <img src={post.imageUrl} alt="" className="max-w-full max-h-full rounded-xl object-contain" />
                </div>
            )}
        </>
    );
}

// ─── Comment Panel ────────────────────────────────────────────────────────────

function CommentPanel({
                          post,
                          currentUser,
                          onClose,
                          onPostUpdate,
                      }: {
    post: Post;
    currentUser: { id: string; name: string } | null;
    onClose: () => void;
    onPostUpdate: (p: Post) => void;
}) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadComments(post.id).then((c) => { setComments(c); setLoading(false); });
    }, [post.id]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [comments.length]);

    const submit = async () => {
        if (!text.trim() || !currentUser || submitting) return;
        setSubmitting(true);
        const comment: Comment = {
            id: Date.now().toString(),
            postId: post.id,
            authorName: currentUser.name,
            authorId: currentUser.id,
            text: text.trim(),
            timestamp: Date.now(),
        };
        await saveComment(comment);
        const updated = { ...post, commentCount: post.commentCount + 1 };
        await savePost(updated);
        onPostUpdate(updated);
        setComments((prev) => [...prev, comment]);
        setText("");
        setSubmitting(false);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden"
                style={{ maxHeight: "80vh" }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 shrink-0">
                    <div>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Discussion</p>
                        <h3 className="font-serif font-bold text-lg text-black">
                            {post.authorName}'s post
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200"
                    >
                        <X size={15} />
                    </button>
                </div>

                {/* Original post snippet */}
                {post.text && (
                    <div className="px-5 py-3 bg-zinc-50 border-b border-zinc-100 shrink-0">
                        <p className="text-xs text-zinc-500 line-clamp-2">{post.text}</p>
                    </div>
                )}

                {/* Comment list */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                    {loading ? (
                        <p className="text-zinc-400 text-sm text-center py-8">Loading…</p>
                    ) : comments.length === 0 ? (
                        <p className="text-zinc-400 text-sm text-center py-10">No comments yet — start the conversation!</p>
                    ) : (
                        comments.map((c) => (
                            <div key={c.id} className="flex gap-3">
                                <Avatar name={c.authorName} size={28} />
                                <div className="flex-1 bg-zinc-50 rounded-xl px-3 py-2.5 border border-zinc-100">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold text-zinc-800">{c.authorName}</span>
                                        <TimeAgo ts={c.timestamp} />
                                    </div>
                                    <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">{c.text}</p>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="px-5 py-4 border-t border-zinc-100 shrink-0">
                    {currentUser ? (
                        <div className="flex items-end gap-3">
                            <Avatar name={currentUser.name} size={30} />
                            <div className="flex-1 relative">
                                <textarea
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
                                    }}
                                    placeholder="Add a comment… (Enter to send)"
                                    rows={2}
                                    className="w-full text-sm resize-none bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                                <button
                                    onClick={submit}
                                    disabled={!text.trim() || submitting}
                                    className="absolute right-2 bottom-2 w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center disabled:opacity-40 hover:bg-orange-600 transition-colors"
                                >
                                    <Send size={12} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-zinc-400 text-center">Sign in to leave a comment</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── New Post Modal ───────────────────────────────────────────────────────────

function NewPostModal({
                          currentUser,
                          onClose,
                          onPosted,
                      }: {
    currentUser: { id: string; name: string };
    onClose: () => void;
    onPosted: (post: Post) => void;
}) {
    const [text, setText] = useState("");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [tag, setTag] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [dragging, setDragging] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File) => {
        if (!file.type.startsWith("image/")) return;
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const submit = async () => {
        if ((!text.trim() && !imagePreview) || submitting) return;
        setSubmitting(true);
        const post: Post = {
            id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            authorName: currentUser.name,
            authorId: currentUser.id,
            text: text.trim(),
            imageUrl: imagePreview ?? undefined,
            timestamp: Date.now(),
            votes: 1,
            commentCount: 0,
            tags: tag.trim() ? [tag.trim().replace(/^#/, "").toLowerCase()] : [],
        };
        await savePost(post);
        onPosted(post);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                        <Avatar name={currentUser.name} size={32} />
                        <div>
                            <p className="text-sm font-bold text-black leading-tight">{currentUser.name}</p>
                            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">New post</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200">
                        <X size={15} />
                    </button>
                </div>

                <div className="px-5 py-4 space-y-4">
                    {/* Text */}
                    <textarea
                        autoFocus
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Share a render, ask a question, or start a discussion…"
                        rows={4}
                        className="w-full text-sm resize-none bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />

                    {/* Image */}
                    {imagePreview ? (
                        <div className="relative rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50">
                            <img src={imagePreview} alt="preview" className="w-full max-h-56 object-cover" />
                            <button
                                onClick={() => setImagePreview(null)}
                                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors"
                            >
                                <X size={13} />
                            </button>
                        </div>
                    ) : (
                        <div
                            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                                dragging ? "border-primary bg-orange-50" : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                            }`}
                            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                            onClick={() => fileRef.current?.click()}
                        >
                            <ImageIcon className={`w-7 h-7 mx-auto mb-2 ${dragging ? "text-primary" : "text-zinc-300"}`} />
                            <p className="text-sm text-zinc-500">
                                Drag & drop an image or{" "}
                                <span className="text-primary font-semibold">browse files</span>
                            </p>
                            <p className="text-xs text-zinc-400 mt-1">PNG, JPG, WebP, GIF</p>
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                            />
                        </div>
                    )}

                    {/* Tag */}
                    <div className="flex items-center gap-2">
                        <Hash size={14} className="text-zinc-400 shrink-0" />
                        <input
                            value={tag}
                            onChange={(e) => setTag(e.target.value.replace(/[\s#]/g, ""))}
                            placeholder="Tag (e.g. modern, studio, wip)"
                            maxLength={24}
                            className="flex-1 text-sm bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-zinc-100 flex items-center justify-between">
                    <p className="text-xs text-zinc-400">Be kind. No spam.</p>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-600 rounded-xl hover:bg-zinc-100 transition-colors font-medium">
                            Cancel
                        </button>
                        <button
                            onClick={submit}
                            disabled={(!text.trim() && !imagePreview) || submitting}
                            className="px-5 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-orange-600 disabled:opacity-40 transition-colors flex items-center gap-2"
                        >
                            {submitting ? "Posting…" : <><Send size={13} /> Post</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type SortMode = "new" | "top";

export default function Community() {
    const { isSignedIn, userName, userId, signIn } = useOutletContext<AuthContext>();

    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortMode, setSortMode] = useState<SortMode>("new");
    const [commentTarget, setCommentTarget] = useState<Post | null>(null);
    const [showNewPost, setShowNewPost] = useState(false);

    const currentUser =
        isSignedIn && userName && userId ? { id: userId, name: userName } : null;

    useEffect(() => {
        loadPosts().then((p) => { setPosts(p); setLoading(false); });
    }, []);

    const sorted = [...posts].sort((a, b) =>
        sortMode === "top" ? b.votes - a.votes : b.timestamp - a.timestamp
    );

    const handleVote = useCallback(
        async (postId: string, dir: 1 | -1) => {
            if (!currentUser) { signIn(); return; }
            setPosts((prev) =>
                prev.map((p) => p.id === postId ? { ...p, votes: p.votes + dir } : p)
            );
            const post = posts.find((p) => p.id === postId);
            if (post) await savePost({ ...post, votes: post.votes + dir });
        },
        [posts, currentUser, signIn]
    );

    const handlePostUpdate = useCallback((updated: Post) => {
        setPosts((prev) => prev.map((p) => p.id === updated.id ? updated : p));
    }, []);

    return (
        <div className="home">
            <Navbar />

            <div className="pt-24 pb-20 max-w-3xl mx-auto px-4 md:px-6">
                {/* Header */}
                <div className="flex items-end justify-between pt-8 mb-8">
                    <div>
                        <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-1">Roomie</p>
                        <h1 className="text-4xl font-serif font-bold text-black">Community</h1>
                        <p className="text-zinc-500 text-sm mt-1">Share renders, ask questions, get inspired.</p>
                    </div>

                    {currentUser ? (
                        <button
                            onClick={() => setShowNewPost(true)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors shadow-sm shrink-0"
                        >
                            <Plus size={15} /> New Post
                        </button>
                    ) : (
                        <button
                            onClick={signIn}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-black text-white text-sm font-bold rounded-xl hover:bg-zinc-800 transition-colors shrink-0"
                        >
                            Sign in to post
                        </button>
                    )}
                </div>

                {/* Sort */}
                <div className="flex items-center gap-1 mb-6 bg-zinc-100 p-1 rounded-xl w-fit">
                    {([
                        { id: "new" as SortMode, icon: <Clock size={13} />, label: "New" },
                        { id: "top" as SortMode, icon: <Flame size={13} />, label: "Top" },
                    ]).map(({ id, icon, label }) => (
                        <button
                            key={id}
                            onClick={() => setSortMode(id)}
                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                                sortMode === id ? "bg-white text-black shadow-sm" : "text-zinc-500 hover:text-black"
                            }`}
                        >
                            {icon} {label}
                        </button>
                    ))}
                </div>

                {/* Feed */}
                {loading ? (
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="bg-white border border-zinc-200 rounded-2xl h-32 animate-pulse" />
                        ))}
                    </div>
                ) : sorted.length === 0 ? (
                    <div className="text-center py-24 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50">
                        <Users className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                        <p className="font-serif text-xl text-zinc-700 mb-1">Nothing here yet</p>
                        <p className="text-zinc-400 text-sm mb-6">Be the first to share something.</p>
                        {!currentUser && (
                            <button
                                onClick={signIn}
                                className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors"
                            >
                                Sign in to post
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sorted.map((post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                currentUserId={currentUser?.id ?? null}
                                onComment={setCommentTarget}
                                onVote={handleVote}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            {commentTarget && (
                <CommentPanel
                    post={commentTarget}
                    currentUser={currentUser}
                    onClose={() => setCommentTarget(null)}
                    onPostUpdate={(updated) => {
                        handlePostUpdate(updated);
                        setCommentTarget(updated);
                    }}
                />
            )}

            {showNewPost && currentUser && (
                <NewPostModal
                    currentUser={currentUser}
                    onClose={() => setShowNewPost(false)}
                    onPosted={(post) => {
                        setPosts((prev) => [post, ...prev]);
                        setShowNewPost(false);
                    }}
                />
            )}
        </div>
    );
}