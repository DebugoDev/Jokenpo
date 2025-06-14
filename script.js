document.addEventListener('DOMContentLoaded', () => {
    const playerId = localStorage.getItem('playerId');
    if (!playerId) {
        playerId = 'browser_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('playerId', playerId);
    }

    const teamNameInput = document.getElementById('teamNameInput');
    const setTeamNameButton = document.getElementById('setTeamNameButton');
    const pedraButton = document.getElementById('rockButton');
    const papelButton = document.getElementById('paperButton');
    const tesouraButton = document.getElementById('scissorsButton');
    const messageDisplay = document.getElementById('message');
    const playerTeamNameDisplay = document.getElementById('player-team-name');
    const playerMoveDisplay = document.getElementById('player-move');
    const opponentTeamNameDisplay = document.getElementById('opponent-team-name');
    const opponentMoveDisplay = document.getElementById('opponent-move');
    const gameStatusDisplay = document.getElementById('game-status');
    const winnerTeamNameDisplay = document.getElementById('winner-team-name');
    const roundCounterDisplay = document.getElementById('round-counter');

    const SERVER_URL = 'http://52.5.245.24:8080/jokenpo/play';

    let currentTeamName = '';
    let playerMadeMove = false;

    // Tenta carregar o codinome da equipe
    const storedTeamName = localStorage.getItem('teamName');
    if (storedTeamName) {
        console.log("Passou aqui")
        teamNameInput.value = storedTeamName;
        currentTeamName = storedTeamName;
        playerTeamNameDisplay.textContent = currentTeamName;
        enableGameInteraction();
        gameStatusDisplay.textContent = 'Codinome carregado. Pronto para jogar Jokenpo!';
        sendJokenpoMove(null)
    } else {
        gameStatusDisplay.textContent = 'Por favor, insira o codinome da sua equipe.';
    }

    function enableGameInteraction() {
        teamNameInput.disabled = true;
        setTeamNameButton.disabled = true;
        pedraButton.disabled = false;
        papelButton.disabled = false;
        tesouraButton.disabled = false;
    }

    function disableGameInteraction() {
        pedraButton.disabled = true;
        papelButton.disabled = true;
        tesouraButton.disabled = true;
    }

    setTeamNameButton.addEventListener('click', (event) => {
        event.preventDefault();

        currentTeamName = teamNameInput.value.trim();
        if (currentTeamName) {
            localStorage.setItem('teamName', currentTeamName);
            playerTeamNameDisplay.textContent = currentTeamName;
            enableGameInteraction();
            gameStatusDisplay.textContent = 'Equipe registrada. Faça sua jogada!';
            messageDisplay.textContent = '';
            winnerTeamNameDisplay.textContent = '';
            playerMoveDisplay.textContent = '?';
            opponentMoveDisplay.textContent = '?';
            sendJokenpoMove(); // Envia jogada nula para registrar a equipe no servidor
        } else {
            alert('Por favor, insira o codinome da sua equipe!');
            teamNameInput.focus();
        }
    });

    // Adiciona event listeners para os botões de jogada
    document.querySelectorAll('.jokenpo-buttons button').forEach(button => {
        button.addEventListener('click', () => {
            if (!playerMadeMove) {
                const playerMove = button.dataset.move;
                sendJokenpoMove(playerMove);
                playerMadeMove = true;
                disableGameInteraction();
            }
        })
    });

    async function sendJokenpoMove(playerMove) {
        if (!currentTeamName) {
            alert('Por favor, confirme o codinome da sua equipe primeiro.');
            return;
        }

        try {

            if (!playerMove) {
                console.warn("Nenhuma jogada foi selecionada. Requisição cancelada.");
                return;
            }
            const payload = {
                playerId: String(playerId).trim(),
                teamName: String(currentTeamName).trim()
            };

            if (typeof playerMove === 'string' && ['Pedra', 'Papel', 'Tesoura'].includes(playerMove)) {
                payload.playerMove = playerMove;
            }

            console.log('Payload enviado:', payload);

            const response = await fetch(SERVER_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const responseText = await response.text(); // captura resposta 
            console.log('Resposta do servidor:', responseText);

            if (!response.ok) {
                throw new Error(`Erro HTTP! Status: ${response.status}`);
            }

            const data = JSON.parse(responseText); // converte para JSON válido
            console.log('Resposta do servidor (JSON):', data);
            updateUI(data);

            if (data.status === 'game_over') {
                setTimeout(() => {
                    playerMadeMove = false;
                    enableGameInteraction();
                    playerMoveDisplay.textContent = '?';
                    opponentMoveDisplay.textContent = '?';
                    winnerTeamNameDisplay.textContent = '';
                    messageDisplay.textContent = 'Nova rodada! Faça sua jogada.';
                }, 5000);
            }

        } catch (error) {
            console.error('Erro ao enviar jogada Jokenpo:', error);
            messageDisplay.textContent = 'Erro ao conectar ao servidor. Verifique o console.';
            enableGameInteraction();
            playerMadeMove = false;
        }
    }


    function updateUI(data) {
        playerTeamNameDisplay.textContent = data.playerTeamName;
        playerMoveDisplay.textContent = data.playerMove || '?';
        opponentTeamNameDisplay.textContent = data.opponentTeamName || 'Aguardando...';
        opponentMoveDisplay.textContent = data.opponentMove || '?';
        roundCounterDisplay.textContent = data.round || '0';

        if (data.status === 'waiting_opponent') {
            messageDisplay.textContent = data.message;
            gameStatusDisplay.textContent = 'Aguardando a jogada do oponente...';
            winnerTeamNameDisplay.textContent = '';
        } else if (data.status === 'game_over') {
            messageDisplay.textContent = data.message;
            gameStatusDisplay.textContent = `Rodada ${data.round} Finalizada!`;
            winnerTeamNameDisplay.textContent = `Vencedor: ${data.winnerTeam}!`;
        } else {
            messageDisplay.textContent = data.message;
            gameStatusDisplay.textContent = 'Estado Desconhecido';
        }
    }

    // Desabilita interação inicial até que o codinome seja definido
    disableGameInteraction();
    teamNameInput.disabled = false;
    setTeamNameButton.disabled = false;
});