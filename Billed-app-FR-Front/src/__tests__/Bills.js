/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event"; // import nécessaire de la librairie pour simuler des événements (ex: click)
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js"; // simulation de l'objet localStorage
import mockStore from "../__mocks__/store.js";
import { bills } from "../fixtures/bills.js";
import router from "../app/Router.js";

// jest.mock("../app/store", () => mockStore);


describe("When I am on Bills Page", () => {

  //-----------------------------//
  //-- TEST 1 [Garance] | surbrillance de l'icône sur la page facture --//
  //-----------------------------//

  test("Then bill icon in vertical layout should be highlighted", async () => {

    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee'
    })) // Ici on va simuler être connecté en tant qu'employé en stockant l'objet user dans localStorage

    const root = document.createElement("div")
    root.setAttribute("id", "root")
    document.body.append(root)
    router()
    window.onNavigate(ROUTES_PATH.Bills)
    await waitFor(() => screen.getByTestId('icon-window'))
    const windowIcon = screen.getByTestId('icon-window')

    //to-do write expect expression
    expect(windowIcon.classList.contains("active-icon")).toBe(true) // [Adrien]

  })

  //-----------------------------//
  //-- TEST 2 [Garance] | factures triées du + ancien au + récent --//
  //-----------------------------//

  test("Then bills should be ordered from earliest to latest", () => {
    document.body.innerHTML = BillsUI({ data: bills })
    const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
    const antiChrono = (a, b) => ((a < b) ? 1 : -1)
    const datesSorted = [...dates].sort(antiChrono)
    expect(dates).toEqual(datesSorted)
  })

})

describe("Given I am connected as a Employee", () => {

  //-----------------------------//
  //-- TEST 3 [Adrien] | vérifie si la page new bill s'ouvre lors du clic sur button --//
  //-----------------------------//

  describe("When I click on the button to add a new bill", () => {
    test("Then new bill page should open", () => {

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      const mockedBills = new Bills({ document, onNavigate, mockStore, localStorage: window.localStorage });

      const handleClickNewBill = jest.fn(mockedBills.handleClickNewBill);
      const newBillButton = screen.getByTestId("btn-new-bill");

      newBillButton.addEventListener("click", handleClickNewBill)
      userEvent.click(newBillButton);

      expect(handleClickNewBill).toHaveBeenCalled();
      expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
      expect(screen.getByTestId("form-new-bill")).toBeTruthy()
    })
  })

  //-----------------------------//
  //-- TEST 4 [Adrien] | vérifie si la modal s'ouvre lors du clic --//
  //-----------------------------//

  describe("When I click on the icon eye", () => {
    test("Then bill should open in a modal", () => {

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      const mockedBills = new Bills({ document, onNavigate, mockStore, localStorage: window.localStorage });

      document.body.innerHTML = BillsUI({ data: bills });


      // const handleClickIconEye = jest.fn(mockedBills.handleClickIconEye)
      $.fn.modal = jest.fn();

      const iconEye = screen.getAllByTestId("icon-eye")[0];
      const handleClickIconEye = jest.fn(mockedBills.handleClickIconEye(iconEye));

      iconEye.addEventListener("click", handleClickIconEye);
      userEvent.click(iconEye);


      expect(handleClickIconEye).toHaveBeenCalled;
      expect(screen.getAllByText("Justificatif")).toBeTruthy();
    });
  })

})

//-----------------------------//
// test d'intégration GET
//-----------------------------//

describe("Given I am a user connected as Employee", () => {

  describe("When I navigate to Bills Page", () => {
    test("fetches bills from mock API GET", async () => {

      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();

      window.onNavigate(ROUTES_PATH.Bills);

      const mockedBills = new Bills({ document, onNavigate, store: mockStore, localStorage: window.localStorage, });

      await waitFor(() => screen.getByText("Mes notes de frais"));
      const bills = await mockedBills.getBills();
      expect(bills.length != 0).toBeTruthy();

      expect(screen.getByTestId("tbody")).toBeTruthy();
    })

    describe("When an error occurs on API", () => {

      // on utilise un beforeEach pour exécuter le code avant la phase de test : avant le test on simule le fait de se connecter avec l'adresse a@a sur le compte employé pour charger les données mockées car on dit que l'on n'a pas réussi a get l'API
      beforeEach(() => {
        jest.spyOn(mockStore, "bills")
        Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
        )
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee',
          email: "a@a"
        }));

        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });

      //-----------------------------//
      //-- TEST [Adrien] | Ne récupère pas les données de l'API donc un message d'erreur s'affiche --//
      //-----------------------------//

      test("fetches bills from an API and fails with 404 message error", async () => {

        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"))
            }
          }
        })
        window.onNavigate(ROUTES_PATH.Bills);
        document.body.innerHTML = BillsUI({ error: "Erreur 404" });
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("fetches messages from an API and fails with 500 message error", async () => {

        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"))
            }
          }
        })

        window.onNavigate(ROUTES_PATH.Bills)
        document.body.innerHTML = BillsUI({ error: "Erreur 500" });
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      })

    })
  });


})




