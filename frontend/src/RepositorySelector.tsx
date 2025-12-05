import { useState } from "react";

interface RepositorySelectorProps {
    currentRepo: string;
    onRepoChange: (repo: string) => void
}

export function RepositorySelector({currentRepo, onRepoChange}: RepositorySelectorProps) {
    // Local State for input field
    const [inputRepo, setInputRepo] = useState(currentRepo);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault(); // prevent page reload

        // non-empty after trimming
        if (inputRepo.trim()) {
            onRepoChange(inputRepo.trim());
        }
    };

    return (
        <form onSubmit={handleSubmit} className="repo-selector">
            <label htmlFor="repo-input">Knowledge Base:</label>

            {/* Controlled input: value tied to state*/}
            <input
                id="repo-input"
                type="text"
                value={inputRepo}
                onChange={(e) => setInputRepo(e.target.value)}
                placeholder="e.g., cnb/docs"
                className="repo-input"
            />

            <button type="submit">Switch</button>
        </form>
    )



}