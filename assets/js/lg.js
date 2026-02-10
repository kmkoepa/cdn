import languageManager from './languageManager.js';

// ========================================
// CONFIGURATION DU SYSTÈME DE NOTIFICATIONS
// ========================================
const notificationConfig = {
    // Délais d'affichage (en millisecondes)
    timing: {
        minDelay: 2000,        // Délai minimum entre deux notifications (2 secondes)
        maxDelay: 8000,        // Délai maximum entre deux notifications (8 secondes)
        displayDuration: 4000  // Durée d'affichage de chaque notification (4 secondes)
    },
    
    // Pourcentages de chance d'apparition par jeu (TOTAL = 100%)
    gameChances: {
        'fn': 30,      // Fortnite - 30%
        'rb': 30,      // Roblox - 30%
        'cod': 10,     // Call of Duty - 10%
        'ff': 10,      // Free Fire - 10%
        'ml': 5,       // Mobile Legends - 5%
        'fc': 5,       // FC 24 - 5%
        'pk': 5,       // Pokemon - 5%
        'mc': 5        // Minecraft - 5%
    },
    
    // Configuration du masquage du nom de joueur
    playerName: {
        visibleChars: 5,  // Nombre de caractères visibles au début
        maskChar: '*'     // Caractère utilisé pour masquer
    },
    
    // Couleurs des bordures selon le statut
    colors: {
        unlocked: '#10b981',      // Vert pour "a débloqué"
        unlocking: '#f59e0b'      // Orange pour "en cours de déblocage"
    }
};

// ========================================
// SYSTÈME DE NOTIFICATIONS DE GAINS
// ========================================
class GainNotificationSystem {
    constructor() {
        this.isActive = false;
        this.currentNotification = null;
        this.notificationTimeout = null;
        this.nextNotificationTimeout = null;
        this.currentGameFilter = null;
        this.servicesData = [];
        this.playersData = [];
        this.flagsData = [];
        this.config = notificationConfig;
        this.gameChances = this.config.gameChances;
    }
    
    async init(servicesData, playersData, flagsData) {
        this.servicesData = servicesData;
        this.playersData = playersData;
        this.flagsData = flagsData;
    }
    
    start(gameFilter = null) {
        this.currentGameFilter = gameFilter;
        this.isActive = true;
        this.scheduleNextNotification();
    }
    
    stop() {
        this.isActive = false;
        if (this.nextNotificationTimeout) {
            clearTimeout(this.nextNotificationTimeout);
            this.nextNotificationTimeout = null;
        }
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
            this.notificationTimeout = null;
        }
        this.hideCurrentNotification();
    }
    
    scheduleNextNotification() {
        if (!this.isActive) return;
        
        const minDelay = this.config.timing.minDelay;
        const maxDelay = this.config.timing.maxDelay;
        const delay = Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay;
        
        this.nextNotificationTimeout = setTimeout(() => {
            this.showRandomNotification();
            this.scheduleNextNotification();
        }, delay);
    }
    
    getRandomGame() {
        if (this.currentGameFilter) {
            const game = this.servicesData.find(s => s.short === this.currentGameFilter);
            return game;
        }
        
        const totalChance = Object.values(this.gameChances).reduce((a, b) => a + b, 0);
        let random = Math.random() * totalChance;
        
        for (const [gameShort, chance] of Object.entries(this.gameChances)) {
            random -= chance;
            if (random <= 0) {
                const game = this.servicesData.find(s => s.short === gameShort);
                return game || this.servicesData[0];
            }
        }
        
        return this.servicesData[0];
    }
    
    getRandomPlayer() {
        const randomIndex = Math.floor(Math.random() * this.playersData.length);
        return this.playersData[randomIndex];
    }
    
    getRandomFlag() {
        const randomIndex = Math.floor(Math.random() * this.flagsData.length);
        return this.flagsData[randomIndex];
    }
    
    getMaskedPlayerName(playerName) {
        const visibleChars = this.config.playerName.visibleChars;
        const maskChar = this.config.playerName.maskChar;
        
        if (playerName.length <= visibleChars) {
            return playerName;
        }
        return playerName.substring(0, visibleChars) + maskChar.repeat(4);
    }
    
    getRandomAmount(game) {
        const amounts = [game.value1, game.value2, game.value3];
        const randomIndex = Math.floor(Math.random() * amounts.length);
        return amounts[randomIndex];
    }
    
    getNotificationTexts() {
        // Récupérer les traductions depuis languageManager
        const translations = languageManager.getSiteTranslations();
        
        // 50% de chance pour chaque type
        const isUnlocked = Math.random() < 0.5;
        
        if (isUnlocked) {
            return {
                text: translations.notificationUnlocked || 'a débloqué',
                color: this.config.colors.unlocked,
                type: 'unlocked'
            };
        } else {
            return {
                text: translations.notificationUnlocking || 'est en cours de déblocage de',
                color: this.config.colors.unlocking,
                type: 'unlocking'
            };
        }
    }
    
    showRandomNotification() {
        if (this.currentNotification) return;
        
        const game = this.getRandomGame();
        if (!game) return;
        
        const player = this.getRandomPlayer();
        const flag = this.getRandomFlag();
        const amount = this.getRandomAmount(game);
        const maskedName = this.getMaskedPlayerName(player);
        const notifTexts = this.getNotificationTexts();
        
        const notification = document.createElement('div');
        notification.className = 'gain-notification';
        notification.setAttribute('data-type', notifTexts.type);
        
        notification.innerHTML = `
            <div class="flag-container" style="border-color: ${notifTexts.color}">
                <img src="assets/images/flags/${flag}.svg" alt="${flag}">
            </div>
            <div class="notification-content">
                <div class="player-name">${maskedName}</div>
                <div class="gain-info">
                    <span class="gain-text">${notifTexts.text}</span>
                    <div class="gain-amount">
                        <span>${amount.toLocaleString()}</span>
                        <img src="assets/images/services/${game.short}/currency.png" 
                             alt="${game.gift}" 
                             class="currency-icon">
                        <span class="currency-name">${game.gift}</span>
                    </div>
                </div>
            </div>
        `;
        
        // Appliquer la couleur de bordure
        notification.style.boxShadow = `0 4px 20px rgba(0, 0, 0, 0.4), 0 0 0 2px ${notifTexts.color}`;
        
        document.body.appendChild(notification);
        this.currentNotification = notification;
        
        this.notificationTimeout = setTimeout(() => {
            this.hideCurrentNotification();
        }, this.config.timing.displayDuration);
    }
    
    hideCurrentNotification() {
        if (!this.currentNotification) return;
        
        this.currentNotification.classList.add('hiding');
        
        setTimeout(() => {
            if (this.currentNotification && this.currentNotification.parentNode) {
                this.currentNotification.parentNode.removeChild(this.currentNotification);
            }
            this.currentNotification = null;
        }, 400);
    }
    
    setGameFilter(gameShort) {
        this.currentGameFilter = gameShort;
    }
    
    clearGameFilter() {
        this.currentGameFilter = null;
    }
    
    updateGameChances(newChances) {
        this.gameChances = { ...this.gameChances, ...newChances };
    }
}

const gainNotificationSystem = new GainNotificationSystem();

// ========================================
// VARIABLES GLOBALES
// ========================================
let servicesData = [];

// ========================================
// FONCTIONS PRINCIPALES
// ========================================
async function getServicesData() {
    const response = await fetch(`assets/langs/${langManager.currentLanguage}/data.json`);
    if (!response.ok) {
        throw new Error('Fetch error')
    }
    const servicesData = await response.json();
    return servicesData;
}

async function renderServices(services) {
    services.forEach((servicesInfo) => {
        if(servicesInfo.istoday==1) {
                createTodaysService(servicesInfo);
        }
        else {
            createPopularService(servicesInfo);
        }
    });
}

function createTodaysService(serviceData) {
    const { name, short, gift, value1, value2, value3, startnumber, color } = serviceData; 
    const translations = languageManager.getSiteTranslations();
    var total = getNumber(startnumber);
    const titleText = translations.titleFormat
        .replace('{name}', name)
        .replace('{gift}', gift);

    var generatedHTML = `
        <article class="todays-card" id="${short}">
            <h3 style="color:${color}">${titleText}</h3>
            <div class="todays-img">
                <img src="assets/images/services/${short}/mini.png" class="card-mini" alt="${titleText}">
                <img src="assets/images/services/${short}/logo.png" class="card-logo" alt="${name} - ${translations.logo}">
                <div class="todays-money" style="background:${color}CC">${value3} ${gift}</div>
                <div class="todays-loot">${translations.lootNow}</div>
            </div>
            <div class="todays-rating">
                <div class="todays-stars" style="color:${color}"><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i></div>
                <div class="todays-reviews" style="color:${color}">${total} ${translations.ratings} - <a style="color:${color}" href="#!">${translations.readReviews}</a></div>
            </div>
        </article>
    `;
    $('.todays-cards').append(generatedHTML);
    $('#'+short+'').click(function() {
        runLoading(short);
    })
}

function createPopularService(serviceData) {
    const { id, name, short, gift, value1, value2, value3, startnumber, color } = serviceData; 
    const translations = languageManager.getSiteTranslations();
    var total = getNumber(startnumber);
    var star = getStarForId(id);
    const titleText = translations.titleFormat
        .replace('{name}', name)
        .replace('{gift}', gift);

    var generatedHTML = `
        <article class="populars-card" id="${short}">
            <div class="populars-card-left">
                <img src="assets/images/services/${short}/mini.png" class="card-mini" alt="${titleText}">
                <img src="assets/images/services/${short}/logo.png" class="card-logo" alt="${name} - ${translations.logo}">
                <div class="populars-money" style="background:${color}CC">${value3} ${gift}</div>
            </div>
            <div class="populars-card-right" style="border-bottom:6px solid ${color}; border-right:6px solid ${color}; ">
                <h3 style="color:${color}">${titleText}</h3>
                <div class="populars-rating">
                    <div class="populars-stars" style="color:${color}"><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>${star}</div>
                    <div class="populars-reviews" style="color:${color}">${total} ${translations.ratings} - <a style="color:${color}" href="#!">${translations.readReviews}</a></div>
                </div>
                <div class="populars-loot">${translations.lootNow}</div>
            </div>
        </article>
    `;
    $('.populars-cards').append(generatedHTML);
    $('#'+short+'').click(function() {
        runLoading(id);
    })
}

function runLoading(id) {
    const service = servicesData.find(s => s.id === id || s.short === id);
    const { name, short, gift, value1, value2, value3, startnumber, color, description, comments } = service; 
    const translations = languageManager.getSiteTranslations();
    const total = getNumber(service.startnumber);

    // Arrêter les notifications pendant le chargement
    gainNotificationSystem.stop();

    var generatedHTML = `
        <img src="assets/images/services/${short}/logo.png" class="loading-logo" alt="${name} - ${translations.logo}">
        <div class="loading-text">
            ${translations.loadingGenerator.replace('{name}', name).replace('{gift}', gift)}
        </div>
        <div class="loading-bar">
        <style>
                .loading-bar::after {
                    background: ${color} !important;
                }
                    #loading::before {
                    background: url('assets/images/services/${short}/bk.png')  0px 0px / 250px repeat !important;
                }
            </style>
            </div>
        <div class="loading-wait">
            <div>${translations.pleaseWait}</div>
        </div>
    `;

    const date = new Date();
    const localDate = date.toLocaleDateString(languageManager.getCurrentLang(), {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
    
    var generatedHTML2 = `
            <style>
                #generator {
                    background-image: url('assets/images/services/${short}/background.jpg');
                }
            </style>
        <div class="generator-header">
            <div class="generator-date generator-info">
                <div>${localDate}</div>
            </div>
            <div class="generator-nbconnected generator-info">
                <div>689 ${translations.online}</div>
            </div>
            <div class="generator-logo">
                <img src="assets/images/services/${short}/logo.png"  alt="${name} - ${translations.logo}">
            </div>
            <div class="generator-start">
                <div>${translations.startGenerator}</div>
            </div>
        </div>
        <div class="generator-page">
            <h2 style="color:${color}">${translations.howToLoot.replace('{gift}', gift)}</h2>
            <div class="generator-howto">
                <div class="generator-howto-left"><img src="assets/images/services/${short}/mini.png"></div>
                <div class="generator-howto-right" style="border-bottom:6px solid ${color}; border-right:6px solid ${color}; ">
                    ${translations.everydayAdd.replace('{gift}', gift)}<br />
                    <div class="generator-remaining">
                        <div>${translations.remainingGift
                            .replace('{amount}', calculateRemainingGift(value1, value2, value3, gift))
                            .replace('{gift}', gift)}</div>
                    </div>
                    ${translations.addNewDaily.replace('{gift}', gift)}<br />
                    <span style="color: ${color};">${translations.counterMessage}</span><br /><br />
                    ${translations.startAndEnjoy}<br />
                </div>
            </div>
            <h2 style="color:${color}">${translations.infos}</h2>
            <div class="generator-description">${description}</div>
            <h2 style="color:${color}">${translations.ratingAndReviews}</h2>
                <div class="generator-comments">
                    <div id="comments-container"></div>
                    <div class="generator-comment-form">
                        <textarea placeholder="${translations.writeComment}" class="comment-textarea"></textarea>
                        <button class="comment-submit" style="background: ${color}">${translations.sendComment}</button>
                    </div>
                    <div class="generator-pagination">
                        <button class="pagination-btn" data-action="prev">${translations.preview}</button>
                        <div class="pagination-numbers"></div>
                        <button class="pagination-btn" data-action="next">${translations.next}</button>
                    </div>
                </div>
            </div>
    `;

    $('.loading-content').empty();
    $('#generator').empty();
    $('.loading-content').append(generatedHTML);
    $('#home').addClass('hidden');
    $('#generator').addClass('hidden');
    $('#loading').slideUp(0).slideDown(400, function() {
        $('#generator').append(generatedHTML2);
        displayComments(comments, color, gift);
        $('.comment-submit').click(function() {
            const commentForm = $('.generator-comment-form');
            commentForm.fadeOut(300, function() {
                commentForm.html(`
                    <div class="comment-success">
                        ${translations.commentSuccess}
                    </div>
                `).fadeIn(300);
            });
        });
        $('.generator-start').click(function() {
            runGenerator(id);
        });
        setTimeout(() => {
            $('#loading').slideUp(400, function() {
                $('.loading-content').empty();
                $('#generator').removeClass('hidden');
                
                // Redémarrer les notifications filtrées par ce jeu
                gainNotificationSystem.start(short);
            });
        }, 4000);
    });
}

function runGenerator(id) {
    const service = servicesData.find(s => s.id === id || s.short === id);
    const { name, short, gift, value1, value2, value3, color, platforms } = service; 
    
    // S'assurer que les notifications sont filtrées pour ce jeu
    gainNotificationSystem.setGameFilter(short);
    
    const translations = languageManager.getSiteTranslations();
    const loadingHTML = `
        <img src="assets/images/services/${short}/logo.png" class="loading-logo" alt="${name} - ${translations.logo}">
        <div class="loading-text">
            ${translations.loadingGenerator.replace('{name}', name).replace('{gift}', gift)}
        </div>
        <div class="loading-bar">
        <style>
            .loading-bar::after {
                background: ${color} !important;
            }
            #loading::before {
                background: url('assets/images/services/${short}/bk.png')  0px 0px / 250px repeat !important;
            }
        </style>
        </div>
        <div class="loading-wait">
            <div>${translations.pleaseWait}</div>
        </div>
    `;
    $('#generator').addClass('hidden');
    $('.loading-content').append(loadingHTML);
    $('#loading').slideUp(0).slideDown(400, function() {
        setTimeout(() => {
            const translations = languageManager.getSiteTranslations();
            
            const platformsHTML = platforms.map(platform => 
                `<div class="generatorRun-platformBtncont"><div class="generatorRun-platformBtn" id="${platform}"><img src="assets/images/os/${platform}.png"></div><div class="generatorRun-platformtxt">${platform}</div></div>`
            ).join('');
            
            const generatedHTML = `
            <style>
                .generatorRun-main::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-image: url('assets/images/services/${short}/background.jpg');
                    opacity: 0.3;
                    pointer-events: none;
                    z-index: 1;
                    background-size: cover;
                    background-attachment: fixed;
                    background-position: bottom;
                    background-size: cover;
                    animation: backgroundZoom 20s ease-in-out infinite;
                }
                .generatorRun-platformBtn:hover {
                    border:4px solid ${color};
                }
                .generatorRun-next:hover {
                    background: ${color};
                }
                .generatorRun-platformSelected {
                    border:4px solid ${color};
                    background: ${color};
                }
                .generatorRun-platformSelected:hover {
                    border:4px solid ${color};
                    background: ${color};
                }
            </style>
            <div class="generatorRun-main">
                <div class="generatorRun-logo"><img src="assets/images/services/${short}/logo.png" alt="${name} - ${translations.logo}"></div>
                <div class="generatorRun-cont">
                        <div class="generatorRun-form1">${translations.usernameLabel}<span style="color:${color};">*</span></div>
                        <div class="generatorRun-form2"><input type="text" class="name" required /></div>
                        <div class="generatorRun-form3">${translations.platformLabel}<span style="color:${color};">*</span></div>
                        <div class="generatorRun-platforms">
                            ${platformsHTML}
                        </div>
                        <div class="generatorRun-next">
                            ${translations.nextButton}
                        </div>
                </div>
            </div>
            `;
            
            $('#generator-run').append(generatedHTML);
            $('.generatorRun-platformBtn').click(function() {
                $('.generatorRun-platformBtn').removeClass('generatorRun-platformSelected');
                $(this).addClass('generatorRun-platformSelected');
            });
            $('#generator-run').removeClass('hidden');
            $('#loading').slideUp(400, function() {
                $('.loading-content').empty();
            });
            
            $('.generatorRun-next').click(function() {
                const username = $('.name').val().trim(); 
                const selectedPlatform = $('.generatorRun-platformSelected').length > 0;
                $('.name').css('border-color', '');
                $('.generatorRun-platforms').css('border', '');
                $('.generatorRun-error').remove(); 
                
                let hasError = false;
                
                if (!username) {
                    $('.name').css('border', `2px solid red`);
                    $('.generatorRun-form2').append(`
                        <div class="generatorRun-error" style="color: white; font-size: 16px; margin-top: 5px;">
                            ${translations.errorUsername}
                        </div>
                    `);
                    hasError = true;
                }
                
                if (!selectedPlatform) {
                    $('.generatorRun-platforms').css('border', `2px solid red`);
                    $('.generatorRun-platforms').after(`
                        <div class="generatorRun-error" style="color: white; font-size: 16px; margin-top: 5px;">
                            ${translations.errorPlatform}
                        </div>
                    `);
                    hasError = true;
                }
                
                if (!hasError) {
                    const selectedPlatformText = $('.generatorRun-platformSelected').parent().find('.generatorRun-platformtxt').text();
                    $('.generatorRun-cont').empty();
                    $('.generatorRun-cont').append(`
                        <style>
                        .loading-bar::after {
                            background:${color}!important;
                        }
                        .loading-bar::after {
                            content: '';
                            position: absolute;
                            top: 0;
                            left: 0;
                            height: 100%;
                            background: ${color};
                            animation: loadingProgress 6s ease-in-out forwards;
                        }
                        </style>
                        <div class="loading-cog" style="color:${color}">
                            <i class="fa-solid fa-gear fa-spin"></i>
                        </div>
                        <div class="loading-bar"></div>
                        <div class="loading-wait">
                            <div>${translations.pleaseWait}</div>
                        </div>
                    `);
                    
                    setTimeout(() => {
                        $('.loading-wait').empty().append(`
                            <div>${translations.searchingUser
                                .replace('{username}', `<span style="color:${color}">"${username}"</span>`)
                                .replace('{platform}', `<span style="color:${color}">${selectedPlatformText}</span>`)}</div>
                        `);
                        setTimeout(() => {
                            $('.loading-wait').empty().append(`
                                <div>${translations.userFound.replace('{username}', `<span style="color:#4ff406">"${username}"</span>`)}</div>
                            `);
                            $('.loading-cog').html(`<i style="color:#4ff406" class="fa-solid fa-circle-check success-icon"></i>`);
                            setTimeout(() => {
                                runGeneratorStep2(username, selectedPlatformText);
                            }, 2000);
                        }, 4000);
                    }, 1000);
                }
            });
        }, 4000);
    });
    
    function runGeneratorStep2(username, selectedPlatform) {
        $('.generatorRun-cont').empty();
        const translations = languageManager.getSiteTranslations();

        const generatedHTML = `
            <div class="generatorRun-form4">
                ${translations.chooseAmount
                    .replace('{username}', `<span style="color:${color}">${username}</span>`)
                    .replace('{gift}', gift)}
            </div>
            <div class="generatorRun-form5">
                <div class="generatorRun2-platformBtncont">
                    <div class="generatorRun2-platformBtn" id="${value1}">
                        <img src="assets/images/services/${short}/value1.png" alt="${value1} ${gift}">
                    </div>
                    <div class="generatorRun2-platformtxt">${value1} ${gift}</div>
                </div>
                <div class="generatorRun2-platformBtncont">
                    <div class="generatorRun2-platformBtn" id="${value2}">
                        <img src="assets/images/services/${short}/value2.png" alt="${value2} ${gift}">
                    </div>
                    <div class="generatorRun2-platformtxt">${value2} ${gift}</div>
                </div>
                <div class="generatorRun2-platformBtncont">
                    <div class="generatorRun2-platformBtn" id="${value3}">
                        <img src="assets/images/services/${short}/value3.png" alt="${value3} ${gift}">
                    </div>
                    <div class="generatorRun2-platformtxt">${value3} ${gift}</div>
                </div>
            </div>
            <div class="generatorRun-next">
                ${translations.nextButton}
            </div>
        `;
        $('.generatorRun-cont').append(generatedHTML);

        $('.generatorRun2-platformBtn').click(function() {
            $('.generatorRun2-platformBtn').removeClass('generatorRun-platformSelected');
            $(this).addClass('generatorRun-platformSelected');
        });
     
        $('.generatorRun-next').click(function() {
            const translations = languageManager.getSiteTranslations();
            const selectedValue = $('.generatorRun-platformSelected').attr('id');
            
            if (!selectedValue) {
                $('.generatorRun-form5').css('border', `2px solid red`);
                $('.generatorRun-form5').after(`
                    <div class="generatorRun-error" style="color: red; font-size: 12px; margin-top: 5px;">
                        ${translations.errorSelectAmount}
                    </div>
                `);
                return;
            }

            const generationMessages = [
                { 
                    msg: translations.generationMessages.establishingConnection.replace('{name}', `<span style="color:${color}">${name}</span>`),
                    time: 2000 
                },
                { 
                    msg: translations.generationMessages.authenticating.replace('{gift}', `<span style="color:${color}">${gift}</span>`),
                    time: 2000 
                },
                { 
                    msg: translations.generationMessages.accessingProtocol.replace('{gift}', `<span style="color:${color}">${gift}</span>`),
                    time: 2000 
                },
                { 
                    msg: translations.generationMessages.preparingTransfer.replace('{name}', `<span style="color:${color}">${name}</span>`),
                    time: 2000 
                },
                { 
                    msg: translations.generationMessages.verifyingCredentials
                        .replace('{username}', `<span style="color:${color}">${username}</span>`)
                        .replace('{platform}', `<span style="color:${color}">${selectedPlatform}</span>`),
                    time: 2000 
                },
                { 
                    msg: translations.generationMessages.addingGift
                        .replace('{amount}', `<span style="color:${color}">${selectedValue}</span>`)
                        .replace('{gift}', gift)
                        .replace('{username}', `<span style="color:${color}">${username}</span>`),
                    time: 7000,
                    beforeShow: () => {
                        const valueNumber = selectedValue == value1 ? '1' : 
                                          selectedValue == value2 ? '2' : '3';
                        $('.loading-cog').html(`
                            <div class="generation-display">
                                <img src="assets/images/services/${short}/value${valueNumber}.png" class="generation-value-img">
                                <div class="generation-counter" style="color:${color}">0</div>
                            </div>
                        `);
                        const startDelay = 500; 
                        const animationDuration = 5000;
                        const startTime = Date.now() + startDelay;
                        const targetValue = parseInt(selectedValue);
                
                        function updateCounter() {
                            const currentTime = Date.now();
                            if (currentTime < startTime) {
                                requestAnimationFrame(updateCounter);
                                return;
                            }
                
                            const elapsed = currentTime - startTime;
                            const progress = Math.min(elapsed / animationDuration, 1);
                            
                            const currentValue = Math.floor(progress * targetValue);
                            $('.generation-counter').text(currentValue);
                
                            if (progress < 1) {
                                requestAnimationFrame(updateCounter);
                            } else {
                                $('.generation-display').addClass('generation-display-finished');
                            }
                        }
                
                        requestAnimationFrame(updateCounter);
                    },
                    afterShow: () => {
                        $('.loading-cog').html('<i class="fa-solid fa-gear fa-spin"></i>');
                    }
                },
                { 
                    msg: translations.generationMessages.generatedSuccess
                        .replace('{amount}', `<span style="color:${color}">${selectedValue}</span>`)
                        .replace('{gift}', gift)
                        .replace('{username}', `<span style="color:${color}">${username}</span>`),
                    time: 3000,
                    beforeShow: () => {
                        $('.loading-cog').html(`<i style="color:#4ff406" class="fa-solid fa-circle-check success-icon"></i>`);
                    }
                },
                { 
                    msg: translations.generationMessages.validatingAccount.replace('{name}', `<span style="color:${color}">${name}</span>`),
                    time: 2000 
                },
                { 
                    msg: translations.generationMessages.securityVerification,
                    time: 2000,
                    beforeShow: () => {
                        $('.loading-cog').html(`<i style="color:#cbcbcb" class="fa-solid fa-circle-question success-icon"></i>`);
                    }
                },
                { 
                    msg: translations.generationMessages.configuringTransfer,
                    time: 2000,
                    beforeShow: () => {
                        $('.loading-cog').html(`<i style="color:#cbcbcb" class="fa-solid fa-circle-question success-icon"></i>`);
                    }
                },
                { 
                    msg: translations.generationMessages.completeAntibot
                        .replace('{amount}', `<span style="color:${color}">${selectedValue}</span>`)
                        .replace('{gift}', gift),
                    time: 3000,
                    beforeShow: () => {
                        $('.loading-cog').html(`<i style="color:#ffd700" class="fa-solid fa-circle-question success-icon"></i>`);
                    }
                }
            ];
    
            const totalTime = generationMessages.reduce((acc, msg) => acc + msg.time, 0) / 1000;
            const styles = `
                <style>
                    .loading-bar::after {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        height: 100%;
                        background: ${color};
                        animation: loadingProgress ${totalTime}s ease-in-out forwards;
                    }
                </style>
            `;
    
            $('.generatorRun-cont').empty().append(`
                ${styles}
                <div class="loading-cog" style="color:${color}">
                    <i class="fa-solid fa-gear fa-spin"></i>
                </div>
                <div class="loading-bar"></div>
                <div class="loading-wait">
                    <div>${translations.pleaseWait}</div>
                </div>
            `);
        
            let currentIndex = 0;
            const showMessage = () => {
                if (currentIndex < generationMessages.length) {
                    const currentMessage = generationMessages[currentIndex];
                    if (currentMessage.beforeShow) {
                        currentMessage.beforeShow();
                    }
    
                    $('.loading-wait').empty().append(`
                        <div>${currentMessage.msg}</div>
                    `);
                    
                    setTimeout(() => {
                        if (currentMessage.afterShow) {
                            currentMessage.afterShow();
                        }
                        currentIndex++;
                        showMessage();
                    }, currentMessage.time);
                } else {
                    $('.loading-cog').empty();
                    $('.loading-bar').remove();
                    $('.loading-wait').empty().append(`
                        <style>
                           .verification-button:hover {
                                background: ${color};
                                transition:0.3s;
                            }
                        </style>
                        <div class="verification-message">
                            <h3 style="color: ${color}">${translations.verificationStep.lastStep}</h3>
                            <div class="top-content">
                                <img src="assets/images/services/${short}/value${selectedValue == value1 ? '1' : selectedValue == value2 ? '2' : '3'}.png" class="generation-value-img">
                                <p class="main-congrats">${translations.verificationStep.congratsMessage
                                    .replace('{username}', `<span style="color: ${color}">${username}</span>`)
                                    .replace('{amount}', selectedValue)
                                    .replace('{gift}', gift)}</p>
                            </div>
                            <div class="bottom-content">
                                <p>${translations.verificationStep.popularService.replaceAll('{color}', color)}</p>
                                <p>${translations.verificationStep.completeTransfer.replaceAll('{color}', color).replaceAll('{gift}', gift)}</p>
                                <p>${translations.verificationStep.takesMinutes.replaceAll('{color}', color)}</p>
                                <div class="verification-button">
                                    ${translations.verificationStep.verifyButton}
                                </div>
                            </div>
                        </div>
                    `);
                }
            };
        
            showMessage();
        });
    }
}

function calculateRemainingGift(value1, value2, value3, gift) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const minutesSinceStartOfDay = Math.floor((now - startOfDay) / (1000 * 60));
    const maxMinutes = 24 * 60;
    const totalGifts = value1 + value2 + value3;
    const remainingRatio = 1 - (minutesSinceStartOfDay / maxMinutes);
    const remaining = Math.max(0, Math.floor(totalGifts * remainingRatio * 100));
    return remaining;
}

function displayComments(comments, serviceColor, giftName, page = 1) {
    const commentsPerPage = 5;
    const startIndex = (page - 1) * commentsPerPage;
    const endIndex = startIndex + commentsPerPage;
    const paginatedComments = comments.slice(startIndex, endIndex);
    const translations = languageManager.getSiteTranslations();
    const freeGiftText = translations.comments.freeGift.replace('{gift}', giftName);
    const separator = translations.comments.separator;

    const container = document.getElementById('comments-container');
    container.innerHTML = '';

    paginatedComments.forEach(comment => {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'generator-comment';
        
        const starsHtml = generateStars(comment.stars, serviceColor);
        const messageWithGift = comment.message.replace('[VARIABLE]', freeGiftText);
        
        let repliesHtml = '';
        if (comment.replies && comment.replies.length > 0) {
            repliesHtml = comment.replies.map(reply => {
                const replyMessage = reply.message.replace('[VARIABLE]', freeGiftText);
                return `
                    <div class="generator-reply">
                        ${reply.author}${separator}${replyMessage}
                    </div>
                `;
            }).join('');
        }
        
        commentDiv.innerHTML = `
            ${comment.author}${separator}${starsHtml}${separator}${messageWithGift}
            ${repliesHtml}
        `;
        
        container.appendChild(commentDiv);
    });

    const totalPages = Math.ceil(comments.length / commentsPerPage);
    const paginationNumbers = document.querySelector('.pagination-numbers');
    paginationNumbers.innerHTML = '';

    const currentPage = page;
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationNumbers.innerHTML += `
            <div class="page-number ${i === currentPage ? 'active' : ''}" 
                 data-page="${i}" 
                 style="${i === currentPage ? `background: ${serviceColor}; color: white;` : ''}">
                ${translations.comments.pageNumber.replace('{number}', i)}
            </div>
        `;
    }

    document.querySelectorAll('.page-number').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const pageNum = parseInt(e.target.dataset.page);
            displayComments(comments, serviceColor, giftName, pageNum);
        });
    });

    document.querySelectorAll('.pagination-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action === 'prev' && currentPage > 1) {
                displayComments(comments, serviceColor, giftName, currentPage - 1);
            } else if (action === 'next' && currentPage < totalPages) {
                displayComments(comments, serviceColor, giftName, currentPage + 1);
            }
        });
    });
}

function generateStars(starCount, color) {
    let stars = '';
    for(let i = 0; i < 5; i++) {
        if(i < starCount) {
            stars += `<i class="fa-solid fa-star" style="color:${color}"></i>`;
        } else {
            stars += `<i class="fa-regular fa-star" style="color:${color}"></i>`;
        }
    }
    return stars;
}

function getNumber(value) {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const hoursSinceStartOfYear = Math.floor((now - startOfYear) / (1000 * 60 * 60));
    const currentNumber = value + hoursSinceStartOfYear;
    return currentNumber;
}

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getStarForId(id) {
    const hash = id * 31; 
    const value = hash % 100; 
    if (value < 75) {
        return '<i class="fa-solid fa-star"></i>';
    }
    return '<i class="fa-solid fa-star-half-stroke"></i>';
}

function updateOnlineCount() {
    const translations = languageManager.getSiteTranslations();
    const headerElement = document.querySelector('.header-nbconnected div');
    const footerElement = document.querySelector('.footer-nbconnected div');
    const generatorElement = document.querySelector('.generator-nbconnected div');
    
    let currentCount = headerElement ? parseInt(headerElement.textContent) : 82;
    const isAdding = Math.random() > 0.5;
    const variation = getRandomNumber(1, 3);
    let newCount = isAdding ? currentCount + variation : currentCount - variation;
    newCount = Math.min(103, Math.max(82, newCount));
    const onlineText = `${newCount} ${translations.online}`;
    
    if (headerElement) {
        headerElement.textContent = onlineText;
    }
    if (footerElement) {
        footerElement.textContent = onlineText;
    }
    if (generatorElement) {
        generatorElement.textContent = onlineText;
    }
    
    const delays = [1000, 2000, 5000];
    const nextDelay = delays[getRandomNumber(0, 2)];
    setTimeout(updateOnlineCount, nextDelay);
}

function generateFallbackPlayers() {
    // Génération de pseudos de secours si players.json n'est pas disponible
    return [
        "ShadowKnight47", "DragonSlayer99", "PhantomStrike21", "NightHunter88", "DarkViper42",
        "ThunderBolt77", "IceWolf23", "FirePhoenix56", "StormRider91", "BloodRaven13",
        "SilentAssassin69", "GhostReaper74", "CyberNinja27", "NeonSamurai45", "VoidWalker82",
        "CrimsonBlade19", "FrostMage33", "ToxicVenom66", "ApexPredator11", "RogueAgent54",
        "NovaStar92", "QuantumLeap38", "ZeroGravity51", "OmegaForce87", "AlphaWolf28",
        "BetaRaptor76", "SkyHawk44", "ViperStrike95", "RazorEdge17", "TitanSlayer62",
        "LunarEclipse89", "SolarFlare34", "CosmicRanger49", "MysticWarrior71", "SavageKing83",
        "VenomFang29", "BlazeRunner58", "StealthPanther96", "IronFist22", "DiamondShark73",
        "PlatinumDragon41", "GoldenEagle85", "SilverBullet16", "BronzeKnight90", "CrystalMage37",
        "ObsidianWarrior65", "MidnightReaper24", "DawnBringer78", "DuskHunter52", "TwilightShadow98"
    ];
}

async function init() {
    // Forcer la langue française (décommentez si nécessaire)
    // languageManager.setForceLang('fr');

    await languageManager.init();

    servicesData = languageManager.getDataTranslations().services;

    const siteTranslations = languageManager.getSiteTranslations();

    updateUITranslations(siteTranslations);

    renderServices(servicesData);

    updateDateDisplay();

    updateOnlineCount();
    
    initLanguageSelector();

    // INITIALISER LE SYSTÈME DE NOTIFICATIONS
    try {
        // Essayer différents chemins possibles
        let playersData, flagsData;
        
        try {
            const playersResponse = await fetch('assets/data/players.json');
            playersData = await playersResponse.json();
        } catch (e) {
            console.warn('players.json non trouvé dans assets/data/, utilisation de données embarquées');
            // Données de fallback
            playersData = { pseudos: generateFallbackPlayers() };
        }
        
        try {
            const flagsResponse = await fetch('assets/data/flags.json');
            flagsData = await flagsResponse.json();
        } catch (e) {
            console.warn('flags.json non trouvé dans assets/data/, utilisation de données embarquées');
            // Codes pays les plus communs
            flagsData = { country_codes: ['fr', 'gb', 'us', 'de', 'es', 'it', 'pt', 'nl', 'ca', 'au', 'be', 'ch', 'br', 'mx', 'ar', 'jp', 'kr', 'cn'] };
        }
        
        await gainNotificationSystem.init(
            servicesData, 
            playersData.pseudos, 
            flagsData.country_codes
        );
        
        // Démarrer les notifications sur la page d'accueil
        gainNotificationSystem.start();
    } catch (error) {
        console.error('Erreur lors de l\'initialisation du système de notifications:', error);
    }
}

function updateUITranslations(translations) {
    document.querySelector('#section-todays h2').textContent = translations.todaysLoots;
    document.querySelector('#section-populars h2').textContent = translations.popularLoots;
}

function updateDateDisplay() {
    const date = new Date();
    const options = { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric'
    };
    const formattedDate = date.toLocaleDateString(languageManager.getCurrentLang(), options);
    
    $('.header-date div').empty().append(formattedDate);
    $('.footer-date div').empty().append(formattedDate);
}

function initLanguageSelector() {
    const currentLang = languageManager.getCurrentLang();
    
    updateCurrentFlag(currentLang);
    
    $('.current-lang').click(function(e) {
        e.stopPropagation();
        $('.lang-dropdown').toggleClass('hidden');
    });
    
    $(document).click(function(e) {
        if (!$(e.target).closest('.language-selector').length) {
            $('.lang-dropdown').addClass('hidden');
        }
    });
    
    $('.lang-option').click(function(e) {
        e.stopPropagation();
        const selectedLang = $(this).data('lang');
        
        if (selectedLang !== languageManager.getCurrentLang()) {
            changeLanguage(selectedLang);
        }
        
        $('.lang-dropdown').addClass('hidden');
    });
    
    $(`.lang-option[data-lang="${currentLang}"]`).addClass('active');
}

function updateCurrentFlag(lang) {
    if(lang === 'en') {
        lang = 'gb';
    }
    const flagPath = `assets/images/flags/${lang}.svg`;
    $('.current-lang .flag-icon').attr('src', flagPath).attr('data-lang', lang);
}

async function changeLanguage(lang) {
    $('body').css('opacity', '0.5');
    
    try {
        await languageManager.setForceLang(lang);
        await languageManager.loadTranslations();
        
        updateCurrentFlag(lang);
        
        $('.lang-option').removeClass('active');
        $(`.lang-option[data-lang="${lang}"]`).addClass('active');
        
        $('.todays-cards').empty();
        $('.populars-cards').empty();
        
        servicesData = languageManager.getDataTranslations().services;
        const siteTranslations = languageManager.getSiteTranslations();
        
        updateUITranslations(siteTranslations);
        renderServices(servicesData);
        updateDateDisplay();
        
        // Redémarrer les notifications avec les nouvelles données
        gainNotificationSystem.stop();
        
        let playersData, flagsData;
        try {
            const playersResponse = await fetch('assets/data/players.json');
            playersData = await playersResponse.json();
        } catch (e) {
            playersData = { pseudos: generateFallbackPlayers() };
        }
        
        try {
            const flagsResponse = await fetch('assets/data/flags.json');
            flagsData = await flagsResponse.json();
        } catch (e) {
            flagsData = { country_codes: ['fr', 'gb', 'us', 'de', 'es', 'it', 'pt', 'nl', 'ca', 'au', 'be', 'ch', 'br', 'mx', 'ar', 'jp', 'kr', 'cn'] };
        }
        
        await gainNotificationSystem.init(
            servicesData, 
            playersData.pseudos, 
            flagsData.country_codes
        );
        gainNotificationSystem.start();
        
    } catch (error) {
        console.error('Error changing language:', error);
    } finally {
        $('body').css('opacity', '1');
    }
}

init();