function show(panel) {
    document.getElementById('loginPanel').style.display = panel === 'login' ? 'block' : 'none';
    document.getElementById('appPanel').style.display = panel === 'app' ? 'block' : 'none'
}

//Função para mostrar as tarefas
function renderTasks(list) {
    const ul = document.getElementById('taskList');
    ul.innerHTML = '';
    list.sort((a, b) => a.title.localeCompare(b.title));

    list.forEach (t => {
        const li = document.createElement('li');

        const title = document.createElement('span');
        title.className = 'task-title';
        title.textContent = t.title;

        const cb = document.createElement('input');
        cb.className = 'checkbox';
        cb.type = 'checkbox';
        cb.checked = !!t.completed;

        cb.addEventListener('change', async() => {
            await fetch(`/tasks/${t.id}`, {
                method: 'PUT',
                headers: {'Content-type' : 'application/json'},
                body: JSON.stringify({completed: cb.checked})
            });
            await fetchTasks();
        });

        //Botão excluir
        const del = document.createElement('button');
        del.textContent = 'Excluir';
        del.style.width = 'auto';
        del.style.marginTop = '0';
        del.style.padding = '8px 10px'
        del.addEventListener('click', async () => {
            const confirmacao = confirm('Tem certeza que deseja excluir esta tarefa?');

            if (!confirmacao) return;
            
            await fetch(`/tasks/${t.id}`,
                {method: 'DELETE'} );
            await fetchTasks();
        });

        //Botão editar
        const edit = document.createElement('button');
        edit.textContent = 'Editar';
        edit.style.width = 'auto';
        edit.style.marginTop = '0';
        edit.style.padding = '8px 10px'
        edit.addEventListener('click', async () => {
            const newTitle = prompt('Novo título', t.title);
            if (!newTitle) return;

            await fetch(`/tasks/${t.id}`,
                {method: 'PUT', headers: {'Content-type': 'application/json'}, body: JSON.stringify({title: newTitle})});

            await fetchTasks();
        });

        const actions = document.createElement('span');
        actions.className = 'task-cta';
        actions.appendChild(cb);
        actions.appendChild(del);
        actions.appendChild(edit);
        li.appendChild(title);
        li.appendChild(actions);
        ul.appendChild(li);
    });
}

let allTasks = [];

async function fetchTasks() {
    const res = await fetch('/tasks');
    if (res.status === 401) {
        show('login');
        return;
    }
    allTasks = await res.json();
    renderTasks(allTasks);
}

const btnTodos = document.querySelector('.btnFiltrar[data-category="todos"]');
const btnPendentes = document.querySelector('.btnFiltrar[data-category="pendentes"]');
const btnConcluidas = document.querySelector('.btnFiltrar[data-category="concluidas"]');

btnTodos.addEventListener('click', () => {
    renderTasks(allTasks);
});

btnPendentes.addEventListener('click', () => {
    renderTasks(allTasks.filter(t => !t.completed));
});

btnConcluidas.addEventListener('click', () => {
    renderTasks(allTasks.filter(t => t.completed));
});

async function checkAuthAndInit() {
    const me = await fetch('/me')
    if (me.ok) {
        show('app');
        await fetchTasks();
    } else {
        show('login');
    }
}
        
document.addEventListener('DOMContentLoaded', async () => {
    const btnLogin = document.getElementById('btnLogin');
    const btnAdd = document.getElementById('btnAdd');
    const btnLogout = document.getElementById('btnLogout')
    const username = document.getElementById('username');
    const password = document.getElementById('password');
    const loginMsg = document.getElementById('loginMsg');
    const newTask = document.getElementById('newTask')

    btnLogin.addEventListener('click', async () => {
        loginMsg.style.display = 'none';
        loginMsg.textContent = ''
        const res = await fetch('/login', {
            method: 'POST',
            headers: {'Content-type': 'application/json'},
            body: JSON.stringify({
                username: (username.value || '').trim(),
                password: (password.value || '').trim()
            })
        })
        if (!res.ok) {
            loginMsg.textContent = 'Credenciais Inválidas';
            loginMsg.style.display = 'block';
            return;
        }
        show('app');
        await fetchTasks();
    })
    btnLogout.addEventListener('click', async() => {
        await fetch('/logout', {method: 'POST'});
        show('login');
    })
    btnAdd.addEventListener('click', async() => {
        const title = (newTask.value || '').trim()
        if (!title) return
        const res = await fetch('/tasks', {
            method: 'POST',
            headers: {'Content-type': 'application/json'},
            body: JSON.stringify({title, completed: false})
        })
        if (res.status === 401) {
            show('login');
            return;
        }
        
        newTask.value = '';
        await fetchTasks();
            
    });
    
    await checkAuthAndInit();
    
});
