lista_livro=[] #Lista para armazenar os dicionarios criados (criação de livros)
id_global = 0 #contador de ID

def cadastrar_livro(id): # função para cadastro de livro e adicionar valor ao ID
    global id_global #chamando o id_global para dentro da função
    nome = input('Qual o nome do livro? ') #identificando nome de livro
    autor = input('Qual o autor do livro? ') #identificando nome do autor
    editora = input('Qual a editora do livro? ') #identificando nome da editora

    livro = {'id': id, 'nome': nome, 'autor': autor, 'editora': editora} #criação de dicionario com os dados inseridos acima
    lista_livro.append(livro) #adicionando dicionario criado na lista
    id_global += 1#adicionando id ao dicionario criado

def consultar_livro(): # função para consulta de livro
    while True:
        print(' Escolha uma opção ') #menu indicando o usuario os possiveis caminhos
        print('1 - Consultar todos')
        print('2 - Consultar por ID')
        print('3 - Consultar por autor')
        print('4 - Retornar ao menu anterior')

        opcao = input('Qual opção deseja? ')#identificando opção desejada
        if opcao == '1':
            print('Consultar todos selecionado')
            for livro in lista_livro: #leitura de todos os dicionarios dentro da lista
                print(livro)
        elif opcao == '2':
            consulta_id = int(input('Digite o ID do livro que deseja consultar: '))#identificando ID desejado
            livro_encontrado = next((livro for livro in lista_livro if livro['id'] == consulta_id), None) #leitura de todos os dicionarios dentro da lista para localização do ID digitado acima
            if livro_encontrado:
                print(f'livro encontrado: {livro_encontrado}') #retorno do dicionario solicitado
            else:
                print('Livro não encontrado...') #retorno de dicionario não cadastrado
        elif opcao == '3':
            autor_consulta = input('Digite o nome do autor que deseja consultar: ')#identificando autor desejado
            livro_autor = [livro for livro in lista_livro if livro['autor'] == autor_consulta]#leitura de todos os dicionarios dentro da lista para localização do autor digitado acima
            if livro_autor:
                print('livro encontrado:')
                for livro in livro_autor:
                    print(livro)#retorno de dicionario cadastrados para o mesmo autor
            else:
                print('Nenhum livro encontrado para esse autor...')#retorno para caso não localize o autor solicitado
        elif opcao == '4':
            break#encerramento de função para retorno ao menu principal

def remover_livro():# função para remover o livro ja cadastrado
    id_remover = int(input('Digite o Id do livro a ser removido: '))#identificando ID desejado para a remoção
    livro_encontrado = next((livro for livro in lista_livro if livro['id'] == id_remover), None)#leitura de todos os dicionarios dentro da lista para localização do ID digitado acima
    if livro_encontrado:
        lista_livro.remove(livro_encontrado)#metodo para remoção do dicionario cadastrado na lista
        print('Livro removido com sucesso.')
    else:
        print('Não foi possivel remover. Livro não encontrado.')#retorno para caso não localize o ID digitado

def valida_int(pergunta, min, max):#função para pergunta com quantidade maxima e minima de opções a selecionar
    x = int(input(pergunta))
    while ((x < min) or (x > max)):
        x = int(input(pergunta))
    return x

print('Bem vindo ao controle de livros do Leonardo Macedo Paes - RU:4638824 ') #Mensagem de boas vindas

while True: #programa principal

    print('Menu')#menu de opções
    print('1 - Cadastrar novo livro')
    print('2 - Consultar livro cadastrado')
    print('3 - Remover livro')
    print('4 - Encerrar programa')

    menu = valida_int('Selecione uma opção: ', 1, 4) #execusão de função valida_int
    if menu == 1:
        print('Cadastrar novo item selecionado')
        cadastrar_livro(id_global)#execusão de função cadastrar_livro
        print('Item cadastrado com sucesso')
    elif menu == 2:
        print('Consultar livro selecionado')
        consultar_livro()#execusão de função consultar_livro
    elif menu == 3:
        print('Remover livro selecionado')
        remover_livro()#execusão de função remover_livro
    elif menu == 4:
        print('Encerrando programa...')
        break#encerramento de programa pela seleção de Nº4