import { useNavigate, useOutletContext, useParams} from "react-router";
import {useEffect, useRef, useState} from "react";
import {generate3DView} from "../../lib/ai.action";
import {Box, Download, RefreshCcw, Share2, X, Wand2, ChevronDown, ChevronUp} from "lucide-react";
import Button from "../../components/ui/Button";
import {createProject, getProjectById} from "../../lib/puter.action";
import {ReactCompareSlider, ReactCompareSliderImage} from "react-compare-slider";

const STYLE_PRESETS = [
    { label: "Default", value: "" },
    { label: "Modern Minimalist", value: "Clean lines, open spaces, minimal furniture, neutral whites and grays, lots of natural light." },
    { label: "Scandinavian", value: "Warm wood tones, cozy textiles, functional furniture, light palette with natural accents." },
    { label: "Industrial", value: "Exposed brick, concrete floors, metal accents, dark palette, Edison bulb lighting." },
    { label: "Bohemian", value: "Rich layered textiles, plants everywhere, warm earthy tones, eclectic furniture mix." },
    { label: "Luxury", value: "High-end materials, marble surfaces, gold accents, statement furniture, dramatic lighting." },
    { label: "Japanese Zen", value: "Tatami-inspired, low furniture, natural wood, bamboo, muted earth tones, serene emptiness." },
    { label: "Mid-Century Modern", value: "Organic shapes, warm wood, retro color pops, clean functional design from the 1950s–60s." },
];

const VisualizerId = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { userId } = useOutletContext<AuthContext>()

    const hasInitialGenerated = useRef(false);

    const [project, setProject] = useState<DesignItem | null>(null);
    const [isProjectLoading, setIsProjectLoading] = useState(true);

    const [isProcessing, setIsProcessing] = useState(false);
    const [currentImage, setCurrentImage] = useState<string | null>(null);

    // Prompt state
    const [customPrompt, setCustomPrompt] = useState("");
    const [selectedPreset, setSelectedPreset] = useState("");
    const [promptOpen, setPromptOpen] = useState(true);

    const handleBack = () => navigate('/');

    const handleExport = () => {
        if (!currentImage) return;
        const link = document.createElement('a');
        link.href = currentImage;
        link.download = `roomie-${id || 'design'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const applyPreset = (value: string) => {
        setSelectedPreset(value);
        setCustomPrompt(value);
    };

    const runGeneration = async (item: DesignItem, prompt?: string) => {
        if (!id || !item.sourceImage) return;

        try {
            setIsProcessing(true);
            setPromptOpen(false);

            const result = await generate3DView({
                sourceImage: item.sourceImage,
                customPrompt: prompt ?? customPrompt,
            });

            if (result.renderedImage) {
                // Set image immediately — do NOT call setProject, which would
                // trigger the useEffect and overwrite this with the cached render
                setCurrentImage(result.renderedImage);

                const updatedItem = {
                    ...item,
                    renderedImage: result.renderedImage,
                    renderedPath: result.renderedPath,
                    timestamp: Date.now(),
                    ownerId: item.ownerId ?? userId ?? null,
                    isPublic: item.isPublic ?? false,
                }

                // Save in background but don't update project state
                createProject({ item: updatedItem, visibility: "private" });
            }
        } catch (error) {
            console.error('Generation failed: ', error)
        } finally {
            setIsProcessing(false);
        }
    }

    const handleRegenerate = () => {
        if (!project) return;
        runGeneration(project, customPrompt);
    };

    useEffect(() => {
        let isMounted = true;

        const loadProject = async () => {
            if (!id) { setIsProjectLoading(false); return; }

            setIsProjectLoading(true);
            const fetchedProject = await getProjectById({ id });

            if (!isMounted) return;

            setProject(fetchedProject);
            setCurrentImage(fetchedProject?.renderedImage || null);
            setIsProjectLoading(false);
            hasInitialGenerated.current = false;
        };

        loadProject();
        return () => { isMounted = false; };
    }, [id]);

    useEffect(() => {
        if (isProjectLoading || hasInitialGenerated.current || !project?.sourceImage) return;

        if (project.renderedImage) {
            setCurrentImage(project.renderedImage);
            hasInitialGenerated.current = true;
            return;
        }

        hasInitialGenerated.current = true;
        void runGeneration(project, "");
    }, [project, isProjectLoading]);

    return (
        <div className="visualizer">
            <nav className="topbar">
                <div className="brand">
                    <Box className="logo" />
                    <span className="name">Roomie</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleBack} className="exit">
                    <X className="icon" /> Exit Editor
                </Button>
            </nav>

            <section className="content">
                {/* ── Prompt Panel ── */}
                <div className="panel" style={{ overflow: 'visible' }}>
                    <div className="panel-header" style={{ cursor: 'pointer' }} onClick={() => setPromptOpen(v => !v)}>
                        <div className="panel-meta">
                            <p>Style & Preferences</p>
                            <h3>Customize your render</h3>
                            <p className="note">Describe what you want — or pick a preset and hit Generate.</p>
                        </div>
                        <div className="panel-actions">
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setPromptOpen(v => !v); }}>
                                {promptOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>

                    {promptOpen && (
                        <div className="p-5 space-y-4 border-t border-zinc-100">
                            {/* Style presets */}
                            <div>
                                <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-2">Quick Presets</p>
                                <div className="flex flex-wrap gap-2">
                                    {STYLE_PRESETS.map((preset) => (
                                        <button
                                            key={preset.label}
                                            onClick={() => applyPreset(preset.value)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 ${
                                                selectedPreset === preset.value
                                                    ? 'bg-primary text-white border-primary'
                                                    : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
                                            }`}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Free-form prompt */}
                            <div>
                                <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-2">Custom Instructions</p>
                                <textarea
                                    value={customPrompt}
                                    onChange={(e) => {
                                        setCustomPrompt(e.target.value);
                                        setSelectedPreset(""); // deselect preset on manual edit
                                    }}
                                    placeholder="e.g. Warm lighting, oak hardwood floors, large windows facing south, a reading nook in the corner, no clutter..."
                                    rows={3}
                                    className="w-full text-sm resize-none bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-zinc-800 placeholder:text-zinc-400"
                                />
                                <p className="text-[11px] text-zinc-400 mt-1">
                                    Leave blank to use Roomie's default photorealistic render.
                                </p>
                            </div>

                            {/* Generate button */}
                            <div className="flex justify-end">
                                <Button
                                    size="sm"
                                    onClick={handleRegenerate}
                                    disabled={isProcessing || !project?.sourceImage}
                                    className="export"
                                    style={{ background: 'var(--color-primary)', color: 'white', border: 'none' }}
                                >
                                    <Wand2 className="w-4 h-4 mr-2" />
                                    {isProcessing ? 'Generating…' : currentImage ? 'Re-generate' : 'Generate'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Render Panel ── */}
                <div className="panel">
                    <div className="panel-header">
                        <div className="panel-meta">
                            <p>Project</p>
                            <h2>{project?.name || `Residence ${id}`}</h2>
                            <p className="note">Created by You</p>
                        </div>

                        <div className="panel-actions">
                            <Button
                                size="sm"
                                onClick={handleExport}
                                className="export"
                                disabled={!currentImage}
                            >
                                <Download className="w-4 h-4 mr-2" /> Export
                            </Button>
                            <Button size="sm" onClick={() => {}} className="share">
                                <Share2 className="w-4 h-4 mr-2" />
                                Share
                            </Button>
                        </div>
                    </div>

                    <div className={`render-area ${isProcessing ? 'is-processing' : ''}`}>
                        {currentImage ? (
                            <img src={currentImage} alt="AI Render" className="render-img" />
                        ) : (
                            <div className="render-placeholder">
                                {project?.sourceImage && (
                                    <img src={project?.sourceImage} alt="Original" className="render-fallback" />
                                )}
                            </div>
                        )}

                        {isProcessing && (
                            <div className="render-overlay">
                                <div className="rendering-card">
                                    <RefreshCcw className="spinner" />
                                    <span className="title">Rendering…</span>
                                    <span className="subtitle">
                                        {customPrompt.trim()
                                            ? 'Applying your preferences'
                                            : 'Generating your 3D visualization'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Compare Panel ── */}
                <div className="panel compare">
                    <div className="panel-header">
                        <div className="panel-meta">
                            <p>Comparison</p>
                            <h3>Before and After</h3>
                        </div>
                        <div className="hint">Drag to compare</div>
                    </div>

                    <div className="compare-stage">
                        {project?.sourceImage && currentImage ? (
                            <ReactCompareSlider
                                defaultValue={50}
                                style={{ width: '100%', height: 'auto' }}
                                itemOne={
                                    <ReactCompareSliderImage src={project?.sourceImage} alt="before" className="compare-img" />
                                }
                                itemTwo={
                                    <ReactCompareSliderImage src={currentImage || project?.renderedImage} alt="after" className="compare-img" />
                                }
                            />
                        ) : (
                            <div className="compare-fallback">
                                {project?.sourceImage && (
                                    <img src={project.sourceImage} alt="Before" className="compare-img" />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    )
}

export default VisualizerId