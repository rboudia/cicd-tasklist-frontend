import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from "../api/taskApi";

const mockTask = {
  id: 1,
  title: "Test",
  description: null,
  completed: false,
  createdAt: "2026-01-15T10:00:00Z",
  updatedAt: "2026-01-15T10:00:00Z",
};

// Fonctions utilitaires pour simuler les réponses de l'API (Succès et Erreurs)
const mockFetchSuccess = (body: any) =>
  vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(body),
  });

const mockFetchError = (status: number, errorText: string) =>
  vi.fn().mockResolvedValue({
    ok: false,
    status,
    text: () => Promise.resolve(errorText),
  });

describe("taskApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // --- GET TASKS ---
  describe("getTasks", () => {
    it("retourne un tableau de tâches en cas de succès", async () => {
      vi.stubGlobal("fetch", mockFetchSuccess([mockTask]));

      const tasks = await getTasks();
      expect(tasks).toEqual([mockTask]);
      expect(fetch).toHaveBeenCalledWith("/api/tasks");
    });

    it("lève une erreur si la réponse réseau est mauvaise", async () => {
      vi.stubGlobal("fetch", mockFetchError(500, "Internal Server Error"));

      await expect(getTasks()).rejects.toThrow(
        "HTTP 500: Internal Server Error",
      );
    });
  });

  // --- GET SINGLE TASK ---
  describe("getTask", () => {
    it("retourne une tâche spécifique en cas de succès", async () => {
      vi.stubGlobal("fetch", mockFetchSuccess(mockTask));

      const task = await getTask(1);
      expect(task).toEqual(mockTask);
      expect(fetch).toHaveBeenCalledWith("/api/tasks/1");
    });

    it("lève une erreur si la tâche n'est pas trouvée", async () => {
      vi.stubGlobal("fetch", mockFetchError(404, "Not Found"));

      await expect(getTask(999)).rejects.toThrow("HTTP 404: Not Found");
    });
  });

  // --- CREATE TASK ---
  describe("createTask", () => {
    const newPayload = { title: "Nouvelle tâche", completed: false };

    it("crée et retourne la nouvelle tâche", async () => {
      vi.stubGlobal(
        "fetch",
        mockFetchSuccess({ ...mockTask, title: "Nouvelle tâche" }),
      );

      const task = await createTask(newPayload);
      expect(task.title).toBe("Nouvelle tâche");
      expect(fetch).toHaveBeenCalledWith("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPayload),
      });
    });

    it("lève une erreur en cas d'échec de création", async () => {
      vi.stubGlobal("fetch", mockFetchError(400, "Bad Request"));

      await expect(createTask(newPayload)).rejects.toThrow(
        "HTTP 400: Bad Request",
      );
    });
  });

  // --- UPDATE TASK ---
  describe("updateTask", () => {
    const updatePayload = { title: "Tâche modifiée" };

    it("met à jour et retourne la tâche modifiée", async () => {
      vi.stubGlobal(
        "fetch",
        mockFetchSuccess({ ...mockTask, title: "Tâche modifiée" }),
      );

      const task = await updateTask(1, updatePayload);
      expect(task.title).toBe("Tâche modifiée");
      expect(fetch).toHaveBeenCalledWith("/api/tasks/1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });
    });

    it("lève une erreur en cas d'échec de mise à jour", async () => {
      vi.stubGlobal("fetch", mockFetchError(403, "Forbidden"));

      await expect(updateTask(1, updatePayload)).rejects.toThrow(
        "HTTP 403: Forbidden",
      );
    });
  });

  // --- DELETE TASK ---
  describe("deleteTask", () => {
    it("supprime la tâche sans retourner de données (void)", async () => {
      // Pour le delete, le code attend juste que response.ok soit true, pas de json()
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));

      await deleteTask(1);
      expect(fetch).toHaveBeenCalledWith("/api/tasks/1", {
        method: "DELETE",
      });
    });

    it("lève une erreur si la suppression échoue", async () => {
      vi.stubGlobal("fetch", mockFetchError(500, "Failed to delete"));

      await expect(deleteTask(1)).rejects.toThrow("HTTP 500: Failed to delete");
    });
  });
});
