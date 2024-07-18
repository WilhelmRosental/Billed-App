/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import Bills from "../containers/Bills.js";
import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    // Test pour vérifier que l'icône de facture est bien surlignée
    test("Then bill icon in vertical layout should be highlighted", async () => {
      // Simule le localStorage avec un utilisateur de type Employee
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));

      // Crée une racine pour notre application et initialise le routeur
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();

      // Navigue vers la page des factures et vérifie que l'icône de facture est active
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });

    // Test pour vérifier que les factures sont triées par date, de la plus ancienne à la plus récente
    test("Then bills should be ordered from earliest to latest", () => {
      // Affiche les factures dans le DOM
      document.body.innerHTML = BillsUI({ data: bills });

      // Récupère toutes les dates des factures et les trie
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);

      // Vérifie que les dates sont dans le bon ordre
      expect(dates).toEqual(datesSorted);
    });

    // Test pour vérifier la navigation vers la page de création d'une nouvelle facture
    test("When I click on the 'New Bill' button, it should navigate to New Bill page", () => {
      // Simule le localStorage avec un utilisateur de type Employee
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));

      // Crée une instance de la classe Bills et simule un clic sur le bouton de nouvelle facture
      const bill = new Bills({
        document,
        onNavigate: jest.fn(),
        store: null,
        localStorage: window.localStorage,
      });
      bill.handleClickNewBill();

      // Vérifie que la navigation vers la page de nouvelle facture a eu lieu
      expect(bill.onNavigate).toHaveBeenCalledWith(ROUTES_PATH["NewBill"]);
    });

    // Test pour vérifier l'affichage de l'image d'une facture dans une modal
    test("When I click on an 'eye' icon, it should display the bill image in a modal", () => {
      // Simule le localStorage avec un utilisateur de type Employee
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));

      // Simule la navigation et affiche les factures dans le DOM
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      document.body.innerHTML = BillsUI({ data: bills });

      // Crée une instance de la classe Bills et récupère le premier icône "oeil"
      const billsInstance = new Bills({
        document,
        onNavigate,
        store: null,
        bills,
        localStorage: window.localStorage,
      });
      const iconEye = screen.getAllByTestId("icon-eye")[0];

      // Simule la fonction jQuery .modal()
      $.fn.modal = jest.fn();

      // Simule le clic sur l'icône "oeil" et vérifie que la modal s'affiche
      const handleClickIconEye = jest.fn(
        billsInstance.handleClickIconEye(iconEye)
      );
      iconEye.addEventListener("click", handleClickIconEye);
      userEvent.click(iconEye);

      expect(handleClickIconEye).toHaveBeenCalled();
      expect($.fn.modal).toHaveBeenCalled();
    });

    // Test d'intégration pour vérifier si un snapshot correspond à la sortie attendue
    test("Then I check if a snapshot corresponds to the expected output", async () => {
      // Simule le localStorage avec un utilisateur de type Employee
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));

      // Crée une nouvelle instance de Bills et appelle la méthode getBills()
      const bill = new Bills({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });
      const result = await bill.getBills();

      // Vérifie que la date de la première facture correspond à la date attendue
      expect(result[0].date).toEqual("2004-04-04");
    });

    describe("When an error occurs on API", () => {
      // Prépare l'environnement pour les tests d'erreur API
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({ type: "Employee" })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });

      // Test pour vérifier le comportement en cas d'erreur 404
      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByTestId("error-message");
        expect(message).toBeTruthy();
      });

      // Test pour vérifier le comportement en cas d'erreur 500
      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByTestId("error-message");
        expect(message).toBeTruthy();
      });
    });
  });
});
