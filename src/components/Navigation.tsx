import { sections } from "../motion/sceneStates";

export function Navigation() {
    return (
        <nav className="navigation-container" aria-label="Portfolio sections">
            <ul className="navigation-list">
                {sections.map((section) => (
                    <li className="navigation-item" key={section.id}>
                        <a
                            className="navigation-link"
                            href={`#${section.id}`}
                            aria-label={section.label}
                        >
                            <span className="navigation-circle" aria-hidden="true" />
                            <span className="navigation-label">{section.label}</span>
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
