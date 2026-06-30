import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TaskList } from "../components/TaskList";
import type { Task } from "../types/task";

const mockTasks: Task[] = [
  {
    id: 1,
    title: "Première tâche",
    description: "Description 1",
    completed: false,
    createdAt: "2026-01-15T10:00:00Z",
    updatedAt: "2026-01-15T10:00:00Z",
  },
  {
    id: 2,
    title: "Deuxième tâche",
    description: null,
    completed: true,
    createdAt: "2026-01-16T10:00:00Z",
    updatedAt: "2026-01-16T10:00:00Z",
  },
];

describe("TaskList", () => {
  // --- TEST DE L'ÉTAT DE CHARGEMENT ---
  it("shows loading state", () => {
    render(
      <TaskList
        tasks={[]}
        loading={true}
        error={null}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByTestId("loading")).toBeInTheDocument();
    expect(screen.getByText("Chargement des tâches...")).toBeInTheDocument();
  });

  // --- TEST DE L'AFFICHAGE CLASSIQUE ---
  it("renders list of tasks", () => {
    render(
      <TaskList
        tasks={mockTasks}
        loading={false}
        error={null}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByTestId("task-list")).toBeInTheDocument();
    expect(screen.getByText("Première tâche")).toBeInTheDocument();
    expect(screen.getByText("Deuxième tâche")).toBeInTheDocument();
    expect(screen.getByText("2 tâches", { exact: false })).toBeInTheDocument();
  });

  // --- TEST DE L'ÉTAT D'ERREUR (Corrigé) ---
  it("shows error state when error prop is provided", () => {
    const errorMessage = "Impossible de charger les données";
    render(
      <TaskList
        tasks={[]}
        loading={false}
        error={errorMessage}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    // L'option { exact: false } permet d'ignorer le "Erreur : " ajouté par ton composant
    expect(
      screen.getByText(errorMessage, { exact: false }),
    ).toBeInTheDocument();
  });

  // --- TEST DE L'ÉTAT VIDE ---
  it("handles empty task list correctly", () => {
    render(
      <TaskList
        tasks={[]}
        loading={false}
        error={null}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    // Le composant ne doit pas afficher le loader
    expect(screen.queryByTestId("loading")).not.toBeInTheDocument();

    // S'il n'y a pas de rendu spécifique pour 0 tâche, on vérifie que la liste est vide
    const listElement = screen.queryByTestId("task-list");
    if (listElement) {
      expect(listElement).toBeEmptyDOMElement();
    }
  });
});
