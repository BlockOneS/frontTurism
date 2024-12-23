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
		buttonColor.classList.toggle('active')
	})
})

// Обработчик кликов по кнопкам фильтров
document.querySelectorAll('.filter-button').forEach(button => {
	button.addEventListener('click', (event) => {
			const filter = event.target.dataset.filter;
			const value = event.target.dataset.value;

			// Обновляем фильтры
			if (filter === "activity_type" || filter === "terrain_type") {
					if (filters[filter].includes(value)) {
							filters[filter] = filters[filter].filter(item => item !== value);
					} else {
							filters[filter].push(value);
					}
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
				  	<img src="image/${rec.id}.jpg">
						<div class="image-overlay">
								<h4>${rec.name}</h4>
								<p>${rec.location}</p>
						</div>
						<div class="image-description">
							<p>${rec.description}</p>
            </div>
          </div>`;
			recommendationsContainer.appendChild(card);
	});
}
console.log(recommendations);

// Обработчик клика на кнопку отправки сообщения
document.getElementById("sendMessage").addEventListener("click", async function() {
  const input = document.getElementById("chatInput");
  const question = input.value.trim();
  input.value = '';

  // Проверка на пустой вопрос
  if (question === "") {
    alert("Пожалуйста, введите вопрос.");
    return;
  }

  try {
    // Отправка запроса на сервер
    const response = await fetch("/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ question }) // Отправка вопроса в формате JSON
    });

    if (!response.ok) {
      throw new Error("Ошибка на сервере.");
    }

    const data = await response.json(); // Ожидаем ответ от сервера

    if (data.error) {
      throw new Error(data.error); // Обработка ошибки от сервера
    }

    // Если ответа нет, выводим сообщение
    if (!data.answer) {
      throw new Error("Ответ от сервера не был получен.");
    }

    // Отображение ответа от AI
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
// Обработчик клика по кнопке закрытия панели
document.getElementById("closePanel").addEventListener("click", function() {
	document.getElementById("chatPanel").style.right = "-500px"; // Закрыть панель
});

// Обработчик клика по кнопке чата для открытия панели
document.querySelector(".chat").addEventListener("click", function() {
	document.getElementById("chatPanel").style.right = "0"; // Открыть панель
});