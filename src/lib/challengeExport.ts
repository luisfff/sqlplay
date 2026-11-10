import type { Challenge } from "../data/challenges";

interface ChallengeGroup {
  title: string;
  challenges: Challenge[];
}

function comment(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => `-- ${line}`)
    .join("\n");
}

export function formatChallengeSql(groups: ChallengeGroup[]): string {
  const sections = groups.map(({ title, challenges }) => {
    const entries = challenges.map((challenge) =>
      [
        `-- ${challenge.title} (${challenge.difficulty})`,
        `-- Dataset: ${challenge.datasetId}`,
        comment(`Question: ${challenge.prompt}`),
        ...(challenge.hint ? [comment(`Hint: ${challenge.hint}`)] : []),
        comment(`Reference solution:\n${challenge.solution}`),
      ].join("\n")
    );
    return [`-- ${title}`, ...entries].join("\n\n");
  });

  return [
    "-- SQLPlay challenge reference",
    "-- Prompts and reference solutions are comments so this file is safe to open or execute.",
    "-- Run each reference solution against a fresh copy of its dataset.",
    "",
    ...sections,
    "",
  ].join("\n");
}
