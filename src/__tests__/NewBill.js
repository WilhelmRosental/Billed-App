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
    test("Then I click on choose file", () => {
      // On simule le localStorage en utilisant localStorageMock
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      // On simule la connexion d'un compte type employé
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      // Remplace le corps du document HTML
      document.body.innerHTML = NewBillUI();

      // On obtient le premier icone à partir du DOM
      const file = screen.getByTestId("file");

      // On crée une fonction espionne
      const handleChangeFile = jest.fn();

      file.addEventListener("click", handleChangeFile);
      userEvent.click(file);

      expect(handleChangeFile).toHaveBeenCalled();
    });

    test("Then I upload the bill it's valid", () => {
      // A COMMENTER
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      document.body.innerHTML = NewBillUI();

      const newBill = new NewBill({
        document,
        onNavigate: null,
        store,
        bills,
        localStorage: window.localStorage,
      });
      const file = screen.getByTestId("file");

      const fileFake = new File([""], "fake-file.png", { type: "image/png" });

      userEvent.upload(file, fileFake);

      expect(file.files.length).toBe(1);

      const handleChangeFile = jest.fn(() => newBill.handleChangeFile);

      file.addEventListener("click", handleChangeFile);
      userEvent.click(file);

      expect(handleChangeFile).toHaveBeenCalled();

      expect(file.files[0].type).toBe("image/png");
    });

    test("Then I upload the bill it's invalid", () => {
      // A COMMENTER
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      document.body.innerHTML = NewBillUI();

      // Remplace les alerte par une fonction vide
      const jsdomAlert = window.alert;
      window.alert = () => {};

      const newBill = new NewBill({
        document,
        onNavigate: null,
        store,
        bills,
        localStorage: window.localStorage,
      });
      const file = screen.getByTestId("file");

      // Créer un fichier factice
      const fileFake = new File([""], "fake-file.txt", { type: "text/plain" });

      userEvent.upload(file, fileFake);

      expect(file.files.length).toBe(1);

      const handleChangeFile = jest.fn(() => newBill.handleChangeFile);

      file.addEventListener("click", handleChangeFile);
      userEvent.click(file);

      expect(handleChangeFile).toHaveBeenCalled();

      expect(file.reportValidity()).not.toBeTruthy();

      window.alert = jsdomAlert; // restore les alert
    });

    test("Then I submit for send", () => {
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
      document.body.innerHTML = NewBillUI();

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        bills,
        localStorage: window.localStorage,
      });

      const buttonSubmit = screen.getByTestId("form-new-bill");

      const handleSubmit = jest.fn((event) => newBill.handleSubmit(event));

      buttonSubmit.addEventListener("submit", handleSubmit);

      fireEvent.submit(buttonSubmit);

      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  //POST Integration
  describe("When I post new bill", () => {
    test("Then bill from mock API POST", async () => {
      jest.spyOn(mockStore, "bills");
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
      const postBill = await mockStore.bills().update(bill);

      expect(postBill).toStrictEqual(bill);
    });
  });

  describe("When an error occurs on API", () => {
    beforeEach(() => {
      document.body.innerHTML = NewBillUI();

      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
    });

    test("Then post new bill fails with error 404", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      // -> Espionne la fonction si elle est appelé dans la console
      const spyOn = jest.spyOn(console, "error");

      // -> Mock d'objets pour créer erreur
      const store = {
        bills: jest.fn(() => newBill.store),
        create: jest.fn(() => Promise.resolve({})),
        update: jest.fn(() => Promise.reject(new Error("Erreur 404"))),
      };

      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage,
      });

      const formNewBill = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn(() => newBill.handleSubmit);
      formNewBill.addEventListener("submit", handleSubmit);

      fireEvent.submit(formNewBill);
      await new Promise(process.nextTick);

      expect(spyOn).toBeCalledWith(new Error("Erreur 404"));
    });
    test("Then post new bill fails with error 505", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      // Espionne la fonction si elle est appelé dans la console
      const spyOn = jest.spyOn(console, "error");
      // Mock d'objets pour créer erreur
      const store = {
        bills: jest.fn(() => newBill.store),
        create: jest.fn(() => Promise.resolve({})),
        update: jest.fn(() => Promise.reject(new Error("Erreur 505"))),
      };
      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage,
      });

      const formNewBill = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn(() => newBill.handleSubmit);
      formNewBill.addEventListener("submit", handleSubmit);

      fireEvent.submit(formNewBill);
      await new Promise(process.nextTick);
      expect(spyOn).toBeCalledWith(new Error("Erreur 505"));
    });
  });
});
