// Обработчик кликов на кнопках фильтров
const filters = {
    season: null,
    approximate_cost: null,
    activity_type: [],
    terrain_type: [],
    camping_available: null
};

// Стильная кнопка
const buttonColor = document.querySelectorAll('.filter-button');
buttonColor.forEach(buttonColor => {
    buttonColor.addEventListener('click', () => {
        buttonColor.classList.toggle('active');
    });
});

// Обработчик кликов по кнопкам фильтров
document.querySelectorAll('.filter-button').forEach(button => {
    button.addEventListener('click', (event) => {
        const filter = event.target.dataset.filter;
        const value = event.target.dataset.value;

        // Обновляем фильтры
        if (filter === "activity_type" || filter === "terrain_type") {
            // Разделяем значения по запятой, если это необходимо
            const valuesArray = value.split(', ');

            valuesArray.forEach(val => {
                if (filters[filter].includes(val)) {
                    filters[filter] = filters[filter].filter(item => item !== val);
                } else {
                    filters[filter].push(val);
                }
            });
        } else {
            if (filters[filter] === value) {
                filters[filter] = null;
            } else {
                filters[filter] = value;
            }
        }

        console.log(filters);
    });
});


// Обработчик отправки формы
document.getElementById("get_recommendations").addEventListener("click", async function() {
    try {
        const response = await fetch("/recommendations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(filters)
        });

        if (!response.ok) {
            throw new Error("Нет данных для указанных предпочтений.");
        }

        const recommendations = await response.json();
        displayRecommendations(recommendations);
    } catch (error) {
        alert(error.message);
    }
});

// Функция для отображения рекомендаций
function displayRecommendations(recommendations) {
    const recommendationsContainer = document.getElementById("recommendations");
    recommendationsContainer.innerHTML = '';

    recommendations.forEach(rec => {
        const card = document.createElement("div");
        card.classList.add("card");
        card.innerHTML = `
            <div class="image-container">
                <img src="static/image/${rec.id}.jpg" alt="${rec.name}">
                <div class="image-overlay">
                    <h4>${rec.name}</h4>
                    <p>${rec.location}</p>
                </div>
                <div class="image-description">
                    <p>${rec.description}</p>
                </div>
            </div>
        `;
        recommendationsContainer.appendChild(card);
    });
}

// Обработчик клика на кнопку отправки сообщения
document.getElementById("sendMessage").addEventListener("click", async function() {
	const input = document.getElementById("chatInput");
	const question = input.value.trim();

	// Проверка на пустой вопрос
	if (question === "") {
			alert("Пожалуйста, введите вопрос.");
			return;
	}

	// Отображаем сообщение пользователя в чате
	displayChatMessage("Вы: " + question);

	input.value = '';

	try {
			const response = await fetch("/ask", {
					method: "POST",
					headers: {
							"Content-Type": "application/json"
					},
					body: JSON.stringify({ question })
			});

			if (!response.ok) {
					throw new Error("Ошибка на сервере.");
			}

			const data = await response.json();

			if (data.error) {
					throw new Error(data.error);
			}

			if (!data.answer) {
					throw new Error("Ответ от сервера не был получен.");
			}

			// Отображаем ответ от AI в чате
			displayChatMessage("AI: " + data.answer);
	} catch (error) {
			console.error("Ошибка при запросе к серверу:", error);
			alert("Произошла ошибка при получении ответа. Пожалуйста, попробуйте снова.");
	}
});

// Функция для отображения сообщений в чате
function displayChatMessage(message) {
    const chatBody = document.getElementById("chatBody");
    const messageElement = document.createElement("p");
    messageElement.textContent = message;
    chatBody.appendChild(messageElement);

    // Прокрутка чата вниз, чтобы показать новое сообщение
    chatBody.scrollTop = chatBody.scrollHeight;
}
let chatStatus = false;
// Обработчик клика по кнопке закрытия панели
document.getElementById("closePanel").addEventListener("click", function() {
    document.getElementById("chatPanel").style.right = "-500px"; // Закрыть панель
		chatStatus = false;
});

document.querySelector(".chat").addEventListener("click", function() {
  if (!chatStatus) {
    document.getElementById("chatPanel").style.right = "0";
    chatStatus = true; // Устанавливаем true, когда чат открывается
  } else {
    document.getElementById("chatPanel").style.right = "-500px";
    chatStatus = false; // Устанавливаем false, когда чат закрывается
  }
});