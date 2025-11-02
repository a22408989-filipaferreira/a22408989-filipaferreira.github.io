document.addEventListener("DOMContentLoaded", () => {
    /* ELEMENTS */
    const listOfProducts = document.querySelector(".products-list");
    const listOfItensCart = document.querySelector(".cart-items-list");
    const categoryFilter = document.querySelector("#category-filter");
    const sortBy = document.querySelector("#sort-by");
    const searchBar = document.querySelector("#search-bar");

    /* check if there are any product lists or items in the cart, categories,... */
    if (!listOfProducts || !listOfItensCart || !categoryFilter || !sortBy || !searchBar) {
        console.error("Erro: Um ou mais elementos (listas, carrinho ou filtros) não foram encontrados no HTML.");
        return;
    }

    /* create a localStorage key and then try to retrieve the stored content */
    const CHAVE_STORAGE = "produtos-selecionados";
    let cart = JSON.parse(localStorage.getItem(CHAVE_STORAGE)) || [];

    /* variable for storing products coming from the API */
    let produtos = [];
    /* API URL to get products */
    const PRODUCTS_URL = 'https://deisishop.pythonanywhere.com/products/';
    const CATEGORIES_URL = 'https://deisishop.pythonanywhere.com/categories/';

    /* FUNCTIONS */

    /* save the items in your cart for when the page reloads (in LOCAL STORAGE) */
    function guardarCesto() {
        localStorage.setItem(CHAVE_STORAGE, JSON.stringify(cart));
    }

    /* create a product (in HTML) */
    function criarProduto(produto) {
        const article = document.createElement("article");
        article.className = "product-card";

        article.innerHTML = `
            <span class="product-category-tag">${produto.category}</span> 
            <figure class="image-container"> 
                <img class="product-image" src="${produto.image}" alt="${produto.title}">
            </figure>
            <h3 class="product-title">${produto.title}</h3>
            <p class="product-desc">${produto.description}</p>
            <footer class="product-footer">
                <span class="product-price">€ ${produto.price.toFixed(2)}</span>
                
                <button class="add-to-cart-btn" data-id="${produto.id}">Adicionar</button>
            </footer>
        `;
        return article;
    }

    /* load the products on the page (in HTML) */
    function carregarProdutos(produtos) {
        listOfProducts.innerHTML = "";

        if (produtos.length === 0) {
            listOfProducts.innerHTML = "<li>Nenhum produto encontrado com estes filtros.</li>";
            return;
        }

        produtos.forEach(produto => {
            const elementoArticle = criarProduto(produto);

            const li = document.createElement("li");
            li.dataset.id = produto.id;
            li.appendChild(elementoArticle);

            listOfProducts.appendChild(li);
        });
    }

    /* load the categories in the select filter */
    function carregarCategorias(categorias) {
        categoryFilter.innerHTML = "";

        const allOption = document.createElement("option");
        allOption.value = "all";
        allOption.textContent = "Todas as categorias";
        categoryFilter.appendChild(allOption);

        categorias.forEach(categoria => {
            const option = document.createElement("option");

            const textoCategoria = categoria.charAt(0).toUpperCase() + categoria.slice(1);

            option.value = categoria;
            option.textContent = textoCategoria;
            categoryFilter.appendChild(option);
        });
    }

    /* function that applies the current filters */
    function aplicarFiltros() {
        /* get current values ​​in filters */
        const categorySelected = categoryFilter.value;
        const sortingTypeSelected = sortBy.value;
        const termToSearch = searchBar.value.toLowerCase();

        /* use a copy array so as not to alter the original array */
        let productsFiltred = [...produtos];

        /* apply category filter */
        if (categorySelected !== "all") {
            productsFiltred = productsFiltred.filter(p => {
                return p.category === categorySelected;
            });
        }

        /* apply search filter */
        if (termToSearch) {
            productsFiltred = productsFiltred.filter(p => {
                return p.title.toLowerCase().includes(termToSearch);
            });
        }

        /* apply sort */
        if (sortingTypeSelected === "price-asc") {
            /* sort from cheapest to most expensive */
            productsFiltred.sort((a, b) => a.price - b.price);
        } else if (sortingTypeSelected === "price-desc") {
            /* sort from most expensive to least expensive */
            productsFiltred.sort((a, b) => b.price - a.price);
        }

        /* reload the HTML list with the filtered products */
        carregarProdutos(productsFiltred);
    }

    /* add an item to cart (in HTML) */
    function criaProdutoCesto(item) {
        const li = document.createElement("li");
        li.className = "cart-item";
        li.dataset.id = item.id;
        li.innerHTML = `
            <span class="cart-item-name">${item.title} x${item.quantidade}</span>
            <span class="cart-item-price">€ ${(item.price * item.quantidade).toFixed(2)}</span>
            
            <footer class="cart-item-actions">
                <button class="btn-decrease" data-id="${item.id}">-</button>
                <button class="btn-increase" data-id="${item.id}">+</button>
            </footer>
        `;
        return li;
    }

    /* updates the cart display with all current items and the total price (in HTML) */
    function atualizaCesto() {
        listOfItensCart.innerHTML = "";

        if (cart.length === 0) {
            listOfItensCart.innerHTML = "<li>O carrinho está vazio.</li>";
            return;
        }

        cart.forEach(item => {
            const li = criaProdutoCesto(item);
            listOfItensCart.appendChild(li);
        });

        const total = cart.reduce((soma, item) => soma + item.price * item.quantidade, 0);
        const liTotal = document.createElement("li");
        liTotal.className = "cart-total";
        liTotal.innerHTML = `<strong>Total:</strong> € ${total.toFixed(2)}`;
        listOfItensCart.appendChild(liTotal);
    }

    /* modifies the cart array, saves the changes in localStorage and re-renders the cart (in HTML and LOCAL STORAGE) */
    function adicionarAoCesto(productId) {
        const produto = produtos.find(p => p.id === Number(productId));
        if (!produto) return; // Segurança


        const itemNoCesto = cart.find(i => i.id === produto.id);

        if (itemNoCesto) {
            itemNoCesto.quantidade++;
        } else {
            cart.push({
                id: produto.id,
                title: produto.title,
                price: produto.price,
                quantidade: 1
            });
        }

        guardarCesto();
        atualizaCesto();
    }

    /* reduces the quantity of a product in the cart (if it reaches 0, it removes it completely) saves the changes to localStorage
         and updates the HTML (in HTML and LOCAL STORAGE) */
    function removerDoCesto(productId) {
        const idx = cart.findIndex(i => i.id === Number(productId));
        if (idx === -1) return; // Não encontrou, não faz nada

        cart[idx].quantidade--;

        if (cart[idx].quantidade <= 0) {
            cart.splice(idx, 1);
        }

        guardarCesto();
        atualizaCesto();
    }

    /* EVENT LISTENERS */

    /* if the click is on an "Add to cart" button, adds the corresponding product to the cart. */
    listOfProducts.addEventListener("click", e => {
        const btn = e.target.closest(".add-to-cart-btn");
        if (!btn) return;
        adicionarAoCesto(btn.dataset.id);
    });

    /* identifies whether the user clicked the increase (+) or decrease (-) button and calls the corresponding function to update the cart */
    listOfItensCart.addEventListener("click", e => {
        const inc = e.target.closest(".btn-increase");
        const dec = e.target.closest(".btn-decrease");

        if (inc) {
            adicionarAoCesto(inc.dataset.id);
        }
        if (dec) {
            removerDoCesto(dec.dataset.id);
        }
    });

    categoryFilter.addEventListener("change", aplicarFiltros); 
    sortBy.addEventListener("change", aplicarFiltros);
    searchBar.addEventListener("input", aplicarFiltros); /* input - event that occurs when the user types (in real time) */

    /* message "Loading" */
    listOfProducts.innerHTML = "<li>A carregar produtos...</li>";

    /* AJAX CALLS */

    /* get products */
    fetch(PRODUCTS_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro de rede: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            /* save products - the API returns the products directly as an array */
            produtos = data;

            /* Load the products (in HTML) */
            carregarProdutos(produtos);
        })
        .catch(error => {
            console.error("Erro ao carregar produtos da API:", error);
            listOfProducts.innerHTML = "<li>Ocorreu um erro ao carregar os produtos. Tente novamente mais tarde.</li>";
        });

    /* get categories */
    fetch(CATEGORIES_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro de rede: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            carregarCategorias(data);
        })
        .catch(error => {
            console.error("Erro ao carregar categorias da API:", error);
            categoryFilter.innerHTML = "<option value=''>Erro ao carregar</option>";
        });

    atualizaCesto();
});