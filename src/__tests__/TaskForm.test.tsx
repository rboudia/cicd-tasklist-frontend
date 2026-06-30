import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TaskForm } from "../components/TaskForm";

describe("TaskForm", () => {
  // --- RENDU ET MODES ---
  it("affiche le formulaire en mode création par défaut", () => {
    render(<TaskForm onSubmit={vi.fn()} />);

    expect(screen.getByText("Nouvelle tâche")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ajouter" })).toBeInTheDocument();
    // Le bouton Annuler ne doit pas être là si onCancel n'est pas fourni
    expect(screen.queryByText("Annuler")).not.toBeInTheDocument();
  });

  it("affiche le formulaire en mode édition avec les valeurs initiales", () => {
    const initialValues = {
      title: "Tâche existante",
      description: "Une description",
    };
    render(
      <TaskForm onSubmit={vi.fn()} mode="edit" initialValues={initialValues} />,
    );

    expect(screen.getByText("Modifier la tâche")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Modifier" }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("Tâche existante")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Une description")).toBeInTheDocument();
  });

  // --- VALIDATION ET ERREURS ---
  it("affiche une erreur de validation si le titre est vide à la soumission", () => {
    const mockSubmit = vi.fn();
    render(<TaskForm onSubmit={mockSubmit} />);

    fireEvent.submit(screen.getByTestId("task-form"));

    expect(screen.getByText("Le titre est requis")).toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it("efface le message d'erreur lorsque l'utilisateur commence à taper", () => {
    render(<TaskForm onSubmit={vi.fn()} />);

    // Déclenche l'erreur
    fireEvent.submit(screen.getByTestId("task-form"));
    expect(screen.getByText("Le titre est requis")).toBeInTheDocument();

    // Tape dans l'input
    const titleInput = screen.getByPlaceholderText("Titre de la tâche *");
    fireEvent.change(titleInput, { target: { value: "Nouveau titre" } });

    // L'erreur doit disparaître
    expect(screen.queryByText("Le titre est requis")).not.toBeInTheDocument();
  });

  // --- SOUMISSION ET COMPORTEMENT DES CHAMPS ---
  it('appelle onSubmit et vide les champs en mode "create"', () => {
    const mockSubmit = vi.fn();
    render(<TaskForm onSubmit={mockSubmit} mode="create" />);

    const titleInput = screen.getByPlaceholderText("Titre de la tâche *");
    const descInput = screen.getByPlaceholderText("Description (optionnel)");

    fireEvent.change(titleInput, { target: { value: "Faire les courses" } });
    fireEvent.change(descInput, { target: { value: "Acheter du pain" } });

    fireEvent.submit(screen.getByTestId("task-form"));

    expect(mockSubmit).toHaveBeenCalledWith({
      title: "Faire les courses",
      description: "Acheter du pain",
    });

    // Vérifie que les champs ont bien été vidés (branche if mode === 'create')
    expect(titleInput).toHaveValue("");
    expect(descInput).toHaveValue("");
  });

  it('appelle onSubmit mais NE vide PAS les champs en mode "edit"', () => {
    const mockSubmit = vi.fn();
    const initialValues = {
      title: "Titre initial",
      description: "Desc initiale",
    };
    render(
      <TaskForm
        onSubmit={mockSubmit}
        mode="edit"
        initialValues={initialValues}
      />,
    );

    const titleInput = screen.getByPlaceholderText("Titre de la tâche *");

    // On modifie juste le titre
    fireEvent.change(titleInput, { target: { value: "Titre modifié" } });
    fireEvent.submit(screen.getByTestId("task-form"));

    expect(mockSubmit).toHaveBeenCalledWith({
      title: "Titre modifié",
      description: "Desc initiale", // n'a pas bougé
    });

    // Vérifie que la valeur est restée dans l'input (branche if mode !== 'create')
    expect(titleInput).toHaveValue("Titre modifié");
  });

  it("gère correctement une description vide ou composée d'espaces (retourne undefined)", () => {
    const mockSubmit = vi.fn();
    render(<TaskForm onSubmit={mockSubmit} />);

    const titleInput = screen.getByPlaceholderText("Titre de la tâche *");
    const descInput = screen.getByPlaceholderText("Description (optionnel)");

    fireEvent.change(titleInput, { target: { value: "Titre valide" } });
    fireEvent.change(descInput, { target: { value: "   " } }); // Que des espaces

    fireEvent.submit(screen.getByTestId("task-form"));

    expect(mockSubmit).toHaveBeenCalledWith({
      title: "Titre valide",
      description: undefined, // La description doit être undefined selon ton code
    });
  });

  // --- BOUTON ANNULER ---
  it("appelle onCancel lorsque le bouton Annuler est cliqué", () => {
    const mockCancel = vi.fn();
    render(<TaskForm onSubmit={vi.fn()} onCancel={mockCancel} />);

    const cancelButton = screen.getByRole("button", { name: "Annuler" });
    fireEvent.click(cancelButton);

    expect(mockCancel).toHaveBeenCalledOnce();
  });
});
