/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import store from "../__mocks__/store.js";
import { bills } from "../fixtures/bills.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    // Test pour vérifier le clic sur le champ de sélection de fichier
    test("Then I click on choose file", () => {
      // Simule le localStorage en utilisant localStorageMock
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      // Simule la connexion d'un compte de type employé
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      // Remplace le contenu du document HTML avec l'interface NewBill
      document.body.innerHTML = NewBillUI();

      // Récupère le champ de fichier à partir du DOM
      const file = screen.getByTestId("file");

      // Crée une fonction espionne pour le changement de fichier
      const handleChangeFile = jest.fn();

      // Ajoute un écouteur d'événement pour le clic et simule le clic
      file.addEventListener("click", handleChangeFile);
      userEvent.click(file);

      // Vérifie que la fonction handleChangeFile a été appelée
      expect(handleChangeFile).toHaveBeenCalled();
    });

    // Test pour vérifier le téléchargement d'un fichier valide
    test("Then I upload the bill it's valid", () => {
      // Simule le localStorage en utilisant localStorageMock
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      // Remplace le contenu du document HTML avec l'interface NewBill
      document.body.innerHTML = NewBillUI();

      // Crée une instance de NewBill avec les paramètres nécessaires
      const newBill = new NewBill({
        document,
        onNavigate: null,
        store,
        bills,
        localStorage: window.localStorage,
      });

      // Récupère le champ de fichier à partir du DOM
      const file = screen.getByTestId("file");

      // Crée un faux fichier PNG
      const fileFake = new File([""], "fake-file.png", { type: "image/png" });

      // Simule le téléchargement du fichier
      userEvent.upload(file, fileFake);

      // Vérifie que le fichier a bien été téléchargé
      expect(file.files.length).toBe(1);

      // Crée une fonction espionne pour le changement de fichier
      const handleChangeFile = jest.fn(() => newBill.handleChangeFile);

      // Ajoute un écouteur d'événement pour le clic et simule le clic
      file.addEventListener("click", handleChangeFile);
      userEvent.click(file);

      // Vérifie que la fonction handleChangeFile a été appelée et que le type de fichier est correct
      expect(handleChangeFile).toHaveBeenCalled();
      expect(file.files[0].type).toBe("image/png");
    });

    // Test pour vérifier le téléchargement d'un fichier invalide
    test("Then I upload the bill it's invalid", () => {
      // Simule le localStorage en utilisant localStorageMock
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      // Remplace le contenu du document HTML avec l'interface NewBill
      document.body.innerHTML = NewBillUI();

      // Remplace les alertes par une fonction vide
      const jsdomAlert = window.alert;
      window.alert = () => {};

      // Crée une instance de NewBill avec les paramètres nécessaires
      const newBill = new NewBill({
        document,
        onNavigate: null,
        store,
        bills,
        localStorage: window.localStorage,
      });

      // Récupère le champ de fichier à partir du DOM
      const file = screen.getByTestId("file");

      // Crée un faux fichier texte
      const fileFake = new File([""], "fake-file.txt", { type: "text/plain" });

      // Simule le téléchargement du fichier
      userEvent.upload(file, fileFake);

      // Vérifie que le fichier a bien été téléchargé
      expect(file.files.length).toBe(1);

      // Crée une fonction espionne pour le changement de fichier
      const handleChangeFile = jest.fn(() => newBill.handleChangeFile);

      // Ajoute un écouteur d'événement pour le clic et simule le clic
      file.addEventListener("click", handleChangeFile);
      userEvent.click(file);

      // Vérifie que la fonction handleChangeFile a été appelée et que la validité du fichier est incorrecte
      expect(handleChangeFile).toHaveBeenCalled();
      expect(file.reportValidity()).not.toBeTruthy();

      // Restaure les alertes d'origine
      window.alert = jsdomAlert;
    });

    // Test pour vérifier la soumission du formulaire
    test("Then I submit for send", () => {
      // Simule le localStorage en utilisant localStorageMock
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "example@test.com",
        })
      );
      // Remplace le contenu du document HTML avec l'interface NewBill
      document.body.innerHTML = NewBillUI();

      // Fonction de navigation simulée
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      // Crée une instance de NewBill avec les paramètres nécessaires
      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        bills,
        localStorage: window.localStorage,
      });

      // Récupère le bouton de soumission du formulaire à partir du DOM
      const buttonSubmit = screen.getByTestId("form-new-bill");

      // Crée une fonction espionne pour la soumission du formulaire
      const handleSubmit = jest.fn((event) => newBill.handleSubmit(event));

      // Ajoute un écouteur d'événement pour la soumission et simule la soumission
      buttonSubmit.addEventListener("submit", handleSubmit);
      fireEvent.submit(buttonSubmit);

      // Vérifie que la fonction handleSubmit a été appelée
      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  // Test d'intégration pour le POST de nouvelle facture
  describe("When I post new bill", () => {
    test("Then bill from mock API POST", async () => {
      // Espionne la méthode bills du mockStore
      jest.spyOn(mockStore, "bills");

      // Crée une nouvelle facture
      const bill = {
        id: "47qAXb6fIm2zOKkLzMro",
        vat: "80",
        fileUrl:
          "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
        status: "pending",
        type: "Hôtel et logement",
        commentary: "séminaire billed",
        name: "encore",
        fileName: "preview-facture-free-201801-pdf-1.jpg",
        date: "2004-04-04",
        amount: 400,
        commentAdmin: "ok",
        email: "a@a",
        pct: 20,
      };

      // Simule la mise à jour de la facture via l'API mock
      const postBill = await mockStore.bills().update(bill);

      // Vérifie que la facture postée correspond à celle créée
      expect(postBill).toStrictEqual(bill);
    });
  });

  describe("When an error occurs on API", () => {
    beforeEach(() => {
      // Remplace le contenu du document HTML avec l'interface NewBill
      document.body.innerHTML = NewBillUI();

      // Simule le localStorage avec un utilisateur de type employé
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
    });

    // Test pour vérifier le comportement en cas d'erreur 404 lors du POST
    test("Then post new bill fails with error 404", async () => {
      // Fonction de navigation simulée
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      // Espionne la méthode console.error
      const spyOn = jest.spyOn(console, "error");

      // Crée un store simulé avec une méthode update rejetant une erreur 404
      const store = {
        bills: jest.fn(() => newBill.store),
        create: jest.fn(() => Promise.resolve({})),
        update: jest.fn(() => Promise.reject(new Error("Erreur 404"))),
      };

      // Crée une instance de NewBill avec les paramètres nécessaires
      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage,
      });

      // Récupère le formulaire de nouvelle facture à partir du DOM
      const formNewBill = screen.getByTestId("form-new-bill");

      // Crée une fonction espionne pour la soumission du formulaire
      const handleSubmit = jest.fn(() => newBill.handleSubmit);
      formNewBill.addEventListener("submit", handleSubmit);

      // Simule la soumission du formulaire et attend le traitement asynchrone
      fireEvent.submit(formNewBill);
      await new Promise(process.nextTick);

      // Vérifie que l'erreur 404 a été loguée dans la console
      expect(spyOn).toBeCalledWith(new Error("Erreur 404"));
    });

    // Test pour vérifier le comportement en cas d'erreur 505 lors du POST
    test("Then post new bill fails with error 505", async () => {
      // Fonction de navigation simulée
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      // Espionne la méthode console.error
      const spyOn = jest.spyOn(console, "error");

      // Crée un store simulé avec une méthode update rejetant une erreur 505
      const store = {
        bills: jest.fn(() => newBill.store),
        create: jest.fn(() => Promise.resolve({})),
        update: jest.fn(() => Promise.reject(new Error("Erreur 505"))),
      };

      // Crée une instance de NewBill avec les paramètres nécessaires
      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage,
      });

      // Récupère le formulaire de nouvelle facture à partir du DOM
      const formNewBill = screen.getByTestId("form-new-bill");

      // Crée une fonction espionne pour la soumission du formulaire
      const handleSubmit = jest.fn(() => newBill.handleSubmit);
      formNewBill.addEventListener("submit", handleSubmit);

      // Simule la soumission du formulaire et attend le traitement asynchrone
      fireEvent.submit(formNewBill);
      await new Promise(process.nextTick);

      // Vérifie que l'erreur 505 a été loguée dans la console
      expect(spyOn).toBeCalledWith(new Error("Erreur 505"));
    });
  });
});
