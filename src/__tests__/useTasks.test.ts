import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTasks } from "../hooks/useTasks";
import * as taskApi from "../api/taskApi";
import type { Task } from "../types/task"; // Ajout de l'import du type

// On mock le module entier de l'API pour contrôler ses retours
vi.mock("../api/taskApi");

// Typage strict de notre mock selon l'interface Task
const mockTask: Task = {
  id: 1,
  title: "Tâche de test",
  description: null,
  completed: false,
  createdAt: "2026-01-15T10:00:00Z",
  updatedAt: "2026-01-15T10:00:00Z",
};

// Une deuxième tâche pour valider la branche false de la ternaire (t.id === id ? updated : t)
const mockTask2: Task = {
  id: 2,
  title: "Autre tâche",
  description: "Description 2",
  completed: true,
  createdAt: "2026-01-16T10:00:00Z",
  updatedAt: "2026-01-16T10:00:00Z",
};

describe("useTasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- INITIALISATION ET LOAD TASKS ---
  describe("Initialisation et loadTasks", () => {
    it("charge les tâches au montage avec succès", async () => {
      vi.mocked(taskApi.getTasks).mockResolvedValue([mockTask]);

      const { result } = renderHook(() => useTasks());

      // Vérification de l'état "loading" initial
      expect(result.current.loading).toBe(true);

      // On attend que le hook ait fini son cycle asynchrone
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.tasks).toEqual([mockTask]);
      expect(result.current.error).toBeNull();
      expect(taskApi.getTasks).toHaveBeenCalledOnce();
    });

    it('gère une erreur de type "Error" lors du chargement (branche err instanceof Error)', async () => {
      vi.mocked(taskApi.getTasks).mockRejectedValue(
        new Error("API indisponible"),
      );

      const { result } = renderHook(() => useTasks());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBe("API indisponible");
      expect(result.current.tasks).toEqual([]);
    });

    it("gère une erreur de type inconnu lors du chargement (branche false de la ternaire)", async () => {
      vi.mocked(taskApi.getTasks).mockRejectedValue("Erreur inattendue");

      const { result } = renderHook(() => useTasks());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBe("Une erreur est survenue");
    });
  });

  // --- ADD TASK ---
  describe("addTask", () => {
    it("ajoute une nouvelle tâche au début de la liste", async () => {
      vi.mocked(taskApi.getTasks).mockResolvedValue([]);

      const newTask: Task = { ...mockTask, id: 3, title: "Nouvelle tâche" };
      vi.mocked(taskApi.createTask).mockResolvedValue(newTask);

      const { result } = renderHook(() => useTasks());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        // L'appel respecte strictement l'interface CreateTaskPayload (title, pas de completed)
        await result.current.addTask({
          title: "Nouvelle tâche",
        });
      });

      expect(result.current.tasks).toEqual([newTask]);

      // On vérifie que l'API est appelée avec le bon payload (sans 'completed')
      expect(taskApi.createTask).toHaveBeenCalledWith({
        title: "Nouvelle tâche",
      });
    });
  });

  // --- EDIT TASK ---
  describe("editTask", () => {
    it("met à jour la tâche ciblée dans la liste (branche t.id === id) et laisse les autres intactes", async () => {
      // On retourne deux tâches pour tester la branche false du .map()
      vi.mocked(taskApi.getTasks).mockResolvedValue([mockTask, mockTask2]);

      const updatedTask: Task = { ...mockTask, title: "Titre modifié" };
      vi.mocked(taskApi.updateTask).mockResolvedValue(updatedTask);

      const { result } = renderHook(() => useTasks());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.editTask(1, { title: "Titre modifié" });
      });

      // La tâche 1 est modifiée, la tâche 2 reste identique
      expect(result.current.tasks).toEqual([updatedTask, mockTask2]);

      // L'appel respecte UpdateTaskPayload
      expect(taskApi.updateTask).toHaveBeenCalledWith(1, {
        title: "Titre modifié",
      });
    });
  });

  // --- REMOVE TASK ---
  describe("removeTask", () => {
    it("supprime la tâche ciblée de la liste", async () => {
      vi.mocked(taskApi.getTasks).mockResolvedValue([mockTask, mockTask2]);
      vi.mocked(taskApi.deleteTask).mockResolvedValue(undefined);

      const { result } = renderHook(() => useTasks());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.removeTask(1);
      });

      // Seule la deuxième tâche doit rester
      expect(result.current.tasks).toEqual([mockTask2]);
      expect(taskApi.deleteTask).toHaveBeenCalledWith(1);
    });
  });

  // --- TOGGLE COMPLETE ---
  describe("toggleComplete", () => {
    it("inverse le statut completed et met à jour la liste", async () => {
      vi.mocked(taskApi.getTasks).mockResolvedValue([mockTask, mockTask2]);

      const toggledTask: Task = { ...mockTask, completed: true };
      vi.mocked(taskApi.updateTask).mockResolvedValue(toggledTask);

      const { result } = renderHook(() => useTasks());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.toggleComplete(1);
      });

      // La première tâche bascule, la seconde reste intacte
      expect(result.current.tasks).toEqual([toggledTask, mockTask2]);
      expect(taskApi.updateTask).toHaveBeenCalledWith(1, { completed: true });
    });

    it("ne fait rien si la tâche n'est pas trouvée (branche if (!task) return)", async () => {
      vi.mocked(taskApi.getTasks).mockResolvedValue([mockTask]);

      const { result } = renderHook(() => useTasks());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.toggleComplete(999);
      });

      expect(taskApi.updateTask).not.toHaveBeenCalled();
      expect(result.current.tasks).toEqual([mockTask]);
    });
  });
});
