#Mensagem de boas vindas
print('Bem-vindo a a Sorveteria do Leonardo Paes \n')
print('Digite "AC" para açai ou "CP" para Cupuaçu')

pedido = 0 #Contador de quantidade de pedidos
valor = 0 #Contador de valor de cada pedido

while True:
    sabor = input('Qual sabor deseja? ') #input para identificar o sabor desejado
    if sabor.upper() not in 'AC, CP':
        print('Sabor inválido. Tente novamente')
        continue #mensagem de erro para digitação incorreta + retorno ao menu de sabor
    if sabor.upper() in 'AC':#input para identificar o tamanho desejado
        tamanho = input('Selecione o tamanho: [P/M/G]')
        if tamanho.upper() not in 'P, M, G':
            print('Tamanho inválido. Tente novamente')
            continue#mensagem de erro para digitação incorreta + retorno ao menu de sabor
        if tamanho.upper() in 'P':
            print('O Açaí custa R$ 11.00')
            valor += 11
        elif tamanho.upper() in 'M':
            print('O Açaí custa R$ 16.00')
            valor += 16
        elif tamanho.upper() in 'G': #codigo para seleção de sabor AC, tamanho G
            print('O Açaí custa R$ 20.00')#print com mensagem do custo do produto
            valor += 20 #contador atribuindo o custo na variavel valor
        pedido += 1 #contador atribuindo +1 pedido na variavel pedido
    elif sabor.upper() in 'CP':
        tamanho = input('Selecione o tamanho: [P/M/G]')
        if tamanho.upper() not in 'P, M, G':
            print('Tamanho inválido. Tente novamente')
            continue
        if tamanho.upper() in 'P':
            print('O Cupuaçu custa R$ 9.00')
            valor += 9
        elif tamanho.upper() in 'M':
            print('O Cupuaçu custa R$ 14.00')
            valor += 14
        elif tamanho.upper() in 'G':
            print('O Cupuaçu custa R$ 18.00')
            valor += 18
        pedido += 1
    carrinho = input('Deseja pedir mais alguma coisa? (s/digite outra tecla)') #input para verificar se deseja um novo pedido
    if carrinho.upper() not in 'S':
        break #Encerramento de laço

#print com quantidade de pedidos + valor do pedido
print('Quantidade de pedido(s): {} | Valor a ser pago é de R$ {:.2f}'.format(pedido, valor))


