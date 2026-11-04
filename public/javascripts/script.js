// DOM ELEMENTS

const containerEl = document.getElementById("slideshow_container");
const loadMoreBtn = document.getElementById("loadMore");
const filterEl = document.getElementById("filter-type");
const sortEl = document.getElementById("sort-type");
const refreshBtn = document.getElementById("refresh");

const gridBtn = document.getElementById("grid-view");
const listBtn = document.getElementById("list-view");
const resultsLabel = document.getElementById("results-label");

const API_URL = "https://graphql.anilist.co";

// APPLICATION STATE

let currentPage = 1;
let animeList = [];
let currentType = "TV";
let currentSort = "score";
let currentView = "grid";
let hasNextPage = false;
let isLoading = false;

// FETCH ANIME FROM ANILIST


async function getAnime(type = "TV", page = 1) {
  if (isLoading) return;

  isLoading = true;
  loadMoreBtn.disabled = true;

  if (page === 1) {
    containerEl.innerHTML =
      '<div class="loading">Loading anime database...</div>';
  }

  const query = `
    query ($page: Int, $format: MediaFormat) {
      Page(page: $page, perPage: 25) {
        pageInfo {
          hasNextPage
        }
        media(
          type: ANIME,
          format: $format,
          sort: SCORE_DESC,
          isAdult: false
        ) {
          id
          title {
            english
            romaji
          }
          coverImage {
            large
          }
          averageScore
          popularity
          siteUrl
        }
      }
    }
  `;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        query,
        variables: {
          page,
          format: type
        }
      })
    });

    const result = await response.json();

    if (!response.ok || result.errors) {
      throw new Error(
        result.errors?.[0]?.message || `API Error: ${response.status}`
      );
    }

    const data = result.data.Page;

    animeList = page === 1
      ? data.media
      : [...animeList, ...data.media];

    hasNextPage = data.pageInfo.hasNextPage;

    renderAnime();

    loadMoreBtn.classList.toggle("hidden", !hasNextPage);

    console.log(`Loaded ${animeList.length} anime entries.`);

  } catch (error) {
    console.error("Anime Fetch Error:", error);

    containerEl.innerHTML = `
      <div class="error-message">
        <h3>Unable to load anime data</h3>
        <p>${error.message}</p>
        <p>Try refreshing the database.</p>
      </div>
    `;

  } finally {
    isLoading = false;
    loadMoreBtn.disabled = false;
  }
}

// SORT ANIME

function sortAnimeList(works) {
  const sortedWorks = [...works];

  if (currentSort === "score") {
    sortedWorks.sort(
      (a, b) => (b.averageScore || 0) - (a.averageScore || 0)
    );

  } else if (currentSort === "popularity") {
    sortedWorks.sort(
      (a, b) => (b.popularity || 0) - (a.popularity || 0)
    );

  } else if (currentSort === "title") {
    sortedWorks.sort((a, b) => {
      const titleA = a.title.english || a.title.romaji || "";
      const titleB = b.title.english || b.title.romaji || "";

      return titleA.localeCompare(titleB);
    });
  }

  return sortedWorks;
}

// RENDER ANIME

function renderAnime() {
  const works = sortAnimeList(animeList);

  containerEl.innerHTML = "";

  containerEl.className =
    `anime-container ${currentView}-view`;

  resultsLabel.textContent =
    `${works.length} ANIME ENTRIES`;

  if (works.length === 0) {
    containerEl.innerHTML =
      '<div class="loading">No anime found.</div>';
    return;
  }

  works.forEach((work, index) => {
    const title =
      work.title.english ||
      work.title.romaji ||
      "Unknown Anime";

    const score = work.averageScore != null
      ? (work.averageScore / 10).toFixed(1)
      : "N/A";

    const popularity = work.popularity
      ? work.popularity.toLocaleString()
      : "N/A";

    const card = document.createElement("article");
    card.className = "anime-card";
    card.style.setProperty("--card-index", index);

    // Anime poster
    const image = document.createElement("img");
    image.className = "anime-poster";
    image.src = work.coverImage?.large || "";
    image.alt = `${title} poster`;
    image.loading = "lazy";

    image.onerror = () => {
      image.removeAttribute("src");
      image.alt = "Anime poster unavailable";
      image.classList.add("image-unavailable");
    };

    // Anime information
    const info = document.createElement("div");
    info.className = "anime-info";

    const number = document.createElement("span");
    number.className = "anime-number";
    number.textContent = `ENTRY ${String(index + 1).padStart(3, "0")}`;

    const heading = document.createElement("h3");
    heading.className = "anime-title";
    heading.textContent = title;

    const stats = document.createElement("div");
    stats.className = "anime-stats";

    const scoreEl = document.createElement("span");
    scoreEl.className = "anime-score";
    scoreEl.textContent = `★ ${score}`;

    const popularityEl = document.createElement("span");
    popularityEl.className = "anime-popularity";
    popularityEl.textContent = `Popularity: ${popularity}`;

    stats.append(scoreEl, popularityEl);

    // External AniList link
    const link = document.createElement("a");
    link.className = "anime-link";
    link.href = work.siteUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "View Details ↗";

    info.append(number, heading, stats, link);
    card.append(image, info);

    containerEl.appendChild(card);
  });
}

// GRID / LIST VIEW SWITCHING

function setView(view) {
  currentView = view;

  gridBtn.classList.toggle("active", view === "grid");
  listBtn.classList.toggle("active", view === "list");

  gridBtn.setAttribute("aria-pressed", view === "grid");
  listBtn.setAttribute("aria-pressed", view === "list");

  renderAnime();
}

gridBtn.addEventListener("click", () => {
  setView("grid");
});

listBtn.addEventListener("click", () => {
  setView("list");
});


// KEYBOARD SHORTCUTS


document.addEventListener("keydown", (event) => {
  const target = event.target;

  // Don't switch views while typing in a form field.
  const isTyping =
    target.matches("input, textarea, select") ||
    target.isContentEditable;

  if (isTyping || event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  if (event.key.toLowerCase() === "g") {
    setView("grid");
  }

  if (event.key.toLowerCase() === "l") {
    setView("list");
  }
});


// FILTERING


filterEl.addEventListener("change", (event) => {
  currentType = event.target.value;
  currentPage = 1;
  animeList = [];

  getAnime(currentType, currentPage);
});

// SORTING

sortEl.addEventListener("change", (event) => {
  currentSort = event.target.value;
  renderAnime();
});


// LOAD MORE


loadMoreBtn.addEventListener("click", () => {
  if (hasNextPage && !isLoading) {
    currentPage++;
    getAnime(currentType, currentPage);
  }
});

// REFRESH


refreshBtn.addEventListener("click", () => {
  currentPage = 1;
  animeList = [];

  getAnime(currentType, currentPage);
});

// INITIALIZE APPLICATION

getAnime(currentType, currentPage);