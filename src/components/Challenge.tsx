import { useState } from "react";
import type { Challenge } from "../data/challenges";
import { CLASS_EXERCISES, type ClassExercise } from "../data/classExercises";
import type { CompareResult } from "../lib/compare";
import { findDataset } from "../data/samples";

export type Activity = Challenge | ClassExercise;
export function isClassExercise(activity: Activity): activity is ClassExercise {
  return "steps" in activity;
}

interface ListProps {
  challenges: Challenge[];
  activeId: string | null;
  solved: Record<string, boolean>;
  onSelect: (c: Activity) => void;
}

export function ChallengeList({
  challenges,
  activeId,
  solved,
  onSelect,
}: ListProps) {
  const solvedCount = challenges.filter((c) => solved[c.id]).length;

  // Group by dataset while preserving the configured challenge order.
  const order: string[] = [];
  const groups: Record<string, Challenge[]> = {};
  for (const c of challenges) {
    if (!groups[c.datasetId]) {
      groups[c.datasetId] = [];
      order.push(c.datasetId);
    }
    groups[c.datasetId].push(c);
  }
  return (
    <div className="challenge-list">
      <div className="challenge-progress">
        Homework solved {solvedCount}/{challenges.length}
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${(solvedCount / challenges.length) * 100}%` }}
          />
        </div>
      </div>
      <div className="challenge-section-title">Homework</div>
      {order.map((datasetId) => (
        <div key={datasetId} className="challenge-group">
          <div className="challenge-group-title">
            {findDataset(datasetId).name}
          </div>
          <ul>
            {groups[datasetId].map((c) => (
              <li
                key={c.id}
                className={c.id === activeId ? "active" : ""}
                onClick={() => onSelect(c)}
              >
                <span className="check">{solved[c.id] ? "✓" : "○"}</span>
                <span className="challenge-title-text">{c.title}</span>
                <span className={`diff-dot ${c.difficulty.toLowerCase()}`} />
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="challenge-section-title">Class exercises</div>
      <div className="challenge-group">
        <div className="challenge-group-title">
          Week 1 · Completed {CLASS_EXERCISES.filter((c) => solved[c.id]).length}/{CLASS_EXERCISES.length}
        </div>
        <ul>
          {CLASS_EXERCISES.map((c) => (
            <li
              key={c.id}
              className={c.id === activeId ? "active" : ""}
              onClick={() => onSelect(c)}
            >
              <span className="check">{solved[c.id] ? "✓" : "○"}</span>
              <span className="challenge-title-text">{c.title}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ClassExerciseBar({ exercise, completed, onComplete }: {
  exercise: ClassExercise;
  completed: boolean;
  onComplete: () => void;
}) {
  return (
    <div className="challenge-bar class-exercise-bar">
      <div className="challenge-head"><strong>{exercise.title}</strong></div>
      <p className="challenge-prompt">{exercise.introduction}</p>
      <ol className="class-exercise-steps">
        {exercise.steps.map((step, index) => <li key={index}>{step}</li>)}
      </ol>
      <div className="challenge-actions">
        <button className="btn primary" onClick={onComplete} disabled={completed}>
          {completed ? "Completed" : "Mark complete"}
        </button>
        <span>Self-marked; answers are not checked automatically.</span>
      </div>
    </div>
  );
}

interface BarProps {
  challenge: Challenge;
  feedback: CompareResult | null;
  onCheck: () => void;
  onShowSolution: () => void;
}

export function ChallengeBar({
  challenge,
  feedback,
  onCheck,
  onShowSolution,
}: BarProps) {
  const [showHint, setShowHint] = useState(false);

  return (
    <div className="challenge-bar">
      <div className="challenge-head">
        <span className={`diff-badge ${challenge.difficulty.toLowerCase()}`}>
          {challenge.difficulty}
        </span>
        <strong>{challenge.title}</strong>
      </div>
      <p className="challenge-prompt">{challenge.prompt}</p>

      <div className="challenge-actions">
        <button className="btn primary" onClick={onCheck}>
          ✓ Check answer
        </button>
        {challenge.hint && (
          <button className="btn" onClick={() => setShowHint((h) => !h)}>
            {showHint ? "Hide hint" : "Hint"}
          </button>
        )}
        {!challenge.hideSolution && (
          <button className="btn" onClick={onShowSolution}>
            Show solution
          </button>
        )}
      </div>

      {showHint && challenge.hint && (
        <div className="challenge-hint">💡 {challenge.hint}</div>
      )}

      {feedback && (
        <div
          className={`challenge-feedback ${feedback.pass ? "pass" : "fail"}`}
        >
          {feedback.pass ? "✓ " : "✗ "}
          {feedback.reason}
        </div>
      )}
    </div>
  );
}
