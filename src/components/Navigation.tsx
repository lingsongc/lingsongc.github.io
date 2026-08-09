import { sections } from "../motion/sceneStates";

export function Navigation() {
    const currentYear = new Date().getFullYear();

    return (
        <>
            <div className="navigation-ring" aria-hidden="true" />
            <small className="navigation-copyright">
                Copyright © {currentYear} Chen Ling Song. All Rights Reserved.
            </small>

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
