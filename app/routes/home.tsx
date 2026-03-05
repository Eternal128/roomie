import type { Route } from "./+types/home";
import Navbar from "../../components/Navbar";
import { ArrowRight, ArrowUpRight, Clock, Layers } from "lucide-react";
import Button from "../../components/ui/Button";
import Upload from "../../components/Upload";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Roomie" },
        { name: "description", content: "AI-first design environment" },
    ];
}

export default function Home() {

    const projects = [
        {
            id: "1",
            name: "Residence 1",
            image:
                "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
            timestamp: Date.now(),
        },
        {
            id: "2",
            name: "Residence 2",
            image:
                "https://images.unsplash.com/photo-1600210492493-0946911123ea",
            timestamp: Date.now(),
        },
    ];

    return (
        <div className="home">
            <Navbar />

            <section className="hero">
                <div className="announce">
                    <div className="dot">
                        <div className="pulse"></div>
                    </div>

                    <p>Introducing Roomie</p>
                </div>

                <h1>Bring your dream spaces to life at the speed of thought</h1>

                <p className="subtitle">
                    Roomie is an AI-first design environment that lets you design and render rooms faster than ever.
                </p>

                <div className="actions">
                    <a href="#upload" className="cta">
                        Start Building <ArrowRight className="icon" />
                    </a>

                    <Button variant="outline" size="lg" className="demo">
                        Watch Demo
                    </Button>
                </div>

                <div id="upload" className="upload-shell">
                    <div className="grid-overlay" />

                    <div className="upload-card">
                        <div className="upload-head">
                            <div className="upload-icon">
                                <Layers className="icon" />
                            </div>

                            <h3>Upload your floor plan</h3>
                            <p>Supports JPG, PNG formats up to 10MB</p>
                        </div>

                        {/* UI only upload */}
                        <Upload />
                    </div>
                </div>
            </section>

            <section className="projects">
                <div className="section-inner">
                    <div className="section-head">
                        <div className="copy">
                            <h2>Projects</h2>
                            <p>Your latest work and shared community projects, all in one place.</p>
                        </div>
                    </div>

                    <div className="projects-grid">
                        {projects.map(({ id, name, image, timestamp }) => (
                            <div key={id} className="project-card group">
                                <div className="preview">
                                    <img src={image} alt="Project" />

                                    <div className="badge">
                                        <span>Community</span>
                                    </div>
                                </div>

                                <div className="card-body">
                                    <div>
                                        <h3>{name}</h3>

                                        <div className="meta">
                                            <Clock size={12} />
                                            <span>{new Date(timestamp).toLocaleDateString()}</span>
                                            <span>By James</span>
                                        </div>
                                    </div>

                                    <div className="arrow">
                                        <ArrowUpRight size={18} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}