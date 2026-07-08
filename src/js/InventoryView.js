import Storage from "./API.js";

const mainApp = document.querySelector(".main");
// Selecting the prodcut modal
const addProModal = document.querySelector(".addProSection");
const ProModalAddBtn = document.querySelector(".addProModalSubmitBtn");
const ProModalCancelBtn = document.querySelector(".addProModalCancelBtn");
const ModalTitle = document.querySelector(".addProModal__title");

// Selecting the inputs in the add Product Modal
const productNameInput = document.querySelector(".productNameInput");
const categoryInput = document.querySelector("#categoryInput");
const productQuantityInput = document.querySelector(".productQuantityInput");
const productPriceInput = document.querySelector(".productPriceInput");

// --------------------- SearchBar --------------------------------
const searchBar = document.querySelector(".searchBarInput");

class InventoryUi {
  constructor() {
    this.id = 0; // Setting a default id
    if (ProModalAddBtn) {
      ProModalAddBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.addProductModalLogic();
      });
    }
    if (ProModalCancelBtn) {
      ProModalCancelBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.closeProductModal();
      });
    }

    if (addProModal) {
      addProModal.addEventListener("click", (e) => {
        // Checking if the user click on the empty black space behind the add modal so we can close it
        if (e.target.classList.contains("addProSection")) {
          this.closeProductModal(e); // Closing the Modal
        }
      });
    }
  }
  setApp() {
    // Updating our DOM with needed HTML!
    mainApp.innerHTML = `
    <div class="inventory-app">
        <div class="product-section__header">
        <div class="product-section__header__buttons">
            <button class="addProBtn">เพิ่มวัสดุใหม่</button>
        </div>
        </div>

        <div class="productCard__list"></div>
    </div>`;

    //  Selecting add Product Button and add eventListener
    const addProBtn = document.querySelector(".addProBtn");
    addProBtn.addEventListener("click", () => {
      // Setting the title to be Add new Product
      ModalTitle.textContent = "เพิ่มสินค้าใหม่";
      ProModalAddBtn.textContent = "เพิ่มวัสดุ";
      this.openProductModal();
    });

    // Selecting the products card list section
    this.productSectionHTMl = document.querySelector(".productCard__list");
    this.updateDom(Storage.getProducts());
  }

  updateDom(allProducts) {
    let result = "";

    if (allProducts.length === 0) {
      result = `<p class="stockCard__empty">ไม่พบรายการวัสดุ</p>`;
    }

    // Getting all the Data
    allProducts.forEach((product) => {
      result += this.createProductHTML(product); // Create HTML for each data
    });

    this.productSectionHTMl.innerHTML = result; // Update the Dom

    // Selecting the delete and edit Icon
    const deleteBtns = document.querySelectorAll(".deleteIcon");
    deleteBtns.forEach((deleteBtn) =>
      deleteBtn.addEventListener("click", (e) => {
        const id = Number(e.target.dataset.id);
        this.deleteBtnLogic(id);
      })
    );

    const editBtns = document.querySelectorAll(".editIcon");
    editBtns.forEach((editBtn) =>
      editBtn.addEventListener("click", (e) => {
        const id = Number(e.target.dataset.id);
        this.editBtnLogic(id);
      })
    );
  }

  createProductHTML(prodcut) {
    return `
     <div class="productCard">
        <div class="productCard__info">
          <p class="productCard__name">${prodcut.title}</p>
          <p class="productCard__meta">${this.getCategoryName(prodcut.category)}</p>
        </div>
        <p class="productCard__qty">${Number(prodcut.quantity || 0).toLocaleString()}</p>
        <div class="productCard__actions">
            <div class="editIcon" data-id=${prodcut.id}>
                <svg class="icon">
                <use
                    xlink:href="../assets/images/sprite.svg#editIcon"
                ></use>
                </svg>
            </div>
            <div class="deleteIcon" data-id=${prodcut.id}>
                <img src="../assets/images/deleteIcon.svg" alt="deleteIcon" />
            </div>
        </div>
    </div>
    `;
  }

  getCategoryName(id) {
    const allCategories = Storage.getCategories();
    const existed = allCategories.find((category) => category.id == id);
    if (existed) {
      return existed.title;
    }
    return "No-Category";
  }

  openProductModal() {
    addProModal.classList.remove("--hidden");
    this.clearInputsField();
    productPriceInput.value = "0";
  }

  closeProductModal() {
    addProModal.classList.add("--hidden");
    this.clearInputsField();
    this.id = 0;
  }

  clearInputsField() {
    // clear the input fields
    [
      productPriceInput,
      productQuantityInput,
      categoryInput,
      productNameInput,
    ].forEach((input) => (input.value = ""));
  }

  async addProductModalLogic() {
    // Checking of the field are empty or not
    if (
      !productNameInput.value ||
      !categoryInput.value ||
      !productQuantityInput.value ||
      !productPriceInput.value
    ) {
      alert("Please enter all of the fields!");
      return -1;
    }
    if (
      Number(productPriceInput.value) < 0 ||
      Number(productQuantityInput.value) < 0
    ) {
      alert("Quantity and Price should be at least 0");
      return -1;
    }

    // checking for duplication
    if (this.id != 0) {
      const allProducts = Storage.getProducts();
      const otherProducts = allProducts.filter(
        (product) => product.id != this.id
      );
      console.log(productNameInput.value);

      const existed = otherProducts.find(
        (product) =>
          product.title.toLowerCase().trim() ==
          productNameInput.value.toLowerCase().trim()
      );
      if (existed) {
        alert("Product already Exist");
        return -1;
      }
    }

    // Updating Local Storage
    await Storage.saveProduct({
      id: this.id,
      title: productNameInput.value.trim(),
      category: categoryInput.value,
      quantity: Number(productQuantityInput.value),
      price: Number(productPriceInput.value),
    });

    this.id = 0;

    searchBar.value = "";

    // Updating the DOM
    this.updateDom(Storage.getProducts());
    // Closing the modal
    this.closeProductModal();
  }

  async deleteBtnLogic(id) {
    // Deleting the Product
    await Storage.deleteProduct(id);
    // Update the DOM
    searchBar.value = "";

    this.updateDom(Storage.getProducts());
  }

  editBtnLogic(id) {
    this.id = id;
    // Getting all the Products
    const allProducts = Storage.getProducts();
    // Finding the product with ID
    const selectedProduct = allProducts.find((prodcut) => prodcut.id == id);

    // Opening the Modal
    this.openProductModal();

    ModalTitle.textContent = "แก้ไขวัสดุ"; // Upating Modal title
    ProModalAddBtn.textContent = "บันทึกการแก้ไข";
    // Updating the value for each input
    productNameInput.value = selectedProduct.title;
    categoryInput.value = selectedProduct.category;
    productQuantityInput.value = selectedProduct.quantity;
    productPriceInput.value = selectedProduct.price;
  }

  seachLogic(inputValue) {
    const targetValue = inputValue.toLowerCase().trim();
    const allProducts = Storage.getProducts();
    const filteredItem = allProducts.filter((product) =>
      product.title.toLowerCase().trim().includes(targetValue)
    );
    this.updateDom(filteredItem);
  }
}

export default new InventoryUi();
