/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js"; // simulation de l'objet localStorage
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {

    test("Then mail icon in vertical layout should be hightlighted", async () => {

      const html = NewBillUI();
      document.body.innerHTML = html;
      //to-do write assertion

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      })) // Ici on va simuler être connecté en tant qu'employé en stockant l'objet user dans localStorage

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();

      window.onNavigate(ROUTES_PATH.NewBill);
      await waitFor(() => screen.getByTestId('icon-mail'));
      const windowIcon = screen.getByTestId('icon-mail');

      //to-do write expect expression
      expect(windowIcon.classList.contains("active-icon")).toBe(true) // [Adrien]

    })

  })

  describe("When I select a proof in input file", () => {
    test("Then a correct format has been choose", () => {

      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage, });

      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      const inputBtn = screen.getByTestId("file");

      inputBtn.addEventListener("change", handleChangeFile);
      fireEvent.change(inputBtn, {
        target: {
          files: [new File(["test.jpg"], "test.jpg", { type: "image/jpg" })],
        },
      });

      expect(handleChangeFile).toHaveBeenCalled();
    });
  });

  describe("When I submit form with correct informations", () => {

    test("Then the bill is created", async () => {

      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage, });

      const buttonSendBill = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn(newBill.handleSubmit);
      buttonSendBill.addEventListener("submit", handleSubmit);
      fireEvent.submit(buttonSendBill);

      expect(handleSubmit).toHaveBeenCalled();

    })

  })

})

//-----------------------------//
// test d'intégration POST
//-----------------------------//

describe("Given I am a user connected as Employee", () => {

  describe("When I create a new bill", () => {

    test("Then the new bill is sent", () => {

      Object.defineProperty(window, "localStorage", { value: localStorageMock, });
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a", }));
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();

      const onNavigate = jest.fn((pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      });

      document.body.innerHTML = NewBillUI();

      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage, });

      const buttonSendBill = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn(newBill.handleSubmit);
      buttonSendBill.addEventListener("submit", handleSubmit);
      fireEvent.submit(buttonSendBill);
      expect(handleSubmit).toHaveBeenCalled();

    })
  })
})
