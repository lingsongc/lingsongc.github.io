import { sections } from "../motion/sceneStates";

export function Navigation() {
    return (
        <>
            <div className="navigation-ring" aria-hidden="true" />

            <nav className="navigation-container" aria-label="Portfolio sections">
                <ul className="navigation-list">
                    <li className="navigation-item navigation-theme-slot" aria-hidden="true" />

                    {sections.filter((section) => section.id !== "home").map((section) => (
                        <li className="navigation-item" key={section.id}>
                            <a
                                className="navigation-link"
                                href={`#${section.id}`}
                                aria-label={section.label}
                            >
                                <span className="navigation-label">{section.label}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
        </>
    );
}
