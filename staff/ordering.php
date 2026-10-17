<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ordering</title>
    <style>
        .ordering-item img {
            width: 120px;
            height: 120px;
            object-fit: contain;
        }
    </style>
</head>

<body>
    <div class="menu">
        <div class="ordering-item"></div>
    </div>

    <script>
        function renderMenu(sections) {
            const page = document.querySelector('.menu');
            page.replaceChildren();

            sections.forEach(section => {
                const title = document.createElement('h2');
                title.textContent = section.name;
                page.appendChild(title);

                section.items.forEach(item => {
                    const card = document.createElement('div');
                    card.className = 'ordering-item';

                    card.innerHTML = `
            <img src="../${item.image}" alt="${item.name}">
                <h3>${item.name}</h3>
                <p>Php ${item.price}</p>
                <button type="button">+</button>
                `;

                    page.appendChild(card);
                });
            });
        }

        fetch('../manager/menu.php')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Menu request failed: ${response.status}`);
                }
                return response.json();
            })
            .then(menu => renderMenu(menu.sections))
            .catch(error => {
                document.querySelector('.menu').textContent =
                    `Unable to load menu. ${error.message}`;
                console.error(error);
            });
    </script>
</body>

</html>