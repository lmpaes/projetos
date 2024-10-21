#Mensagem de boas vindas + menu inicial
print('Bem-Vindo a copiadora do Leonardo Paes')
print('DIG - Digitação')
print('ICO - Impressão colorida')
print('IBO - Impressão Preto e Branco')
print('FOT - Fotocópia')

def escolha_servico(): #Função para identificar o tipo de serviço desejado
    custo = 0 #contador
    while True:
        servico = input('Digite qual serviço deseja: ')
        if servico.upper() in 'DIG':
            custo += 1.10
            return custo
        elif servico.upper() in 'ICO':
            custo += 1.00
            return custo
        elif servico.upper() in 'IBO':
            custo += 0.40
            return custo
        elif servico.upper() in 'FOT': #função para adicionar valor ao contador
            custo += 0.20 #valor da fotocopia
            return custo
        else:#função senão para seleção de opção diferente de DIG, ICO, IBO ou FOT
            print('Opção invalida, tente novamente...')
            continue

def num_paginas():#Função para identificar o numero de paginas e desconto
    while True:
        try:#tentativa de calculo de desconto
            paginas = int(input('Quantas paginas deseja? '))
            if paginas < 20:#para casos abaixo de 20 paginas
                return paginas
            elif paginas < 200:#para casos entre 20 e 199 paginas o desconto de 15%
                return paginas * 0.85
            elif paginas < 2000:#para casos entre 200 e 1999 paginas o desconto de 20%
                return paginas * 0.80
            elif paginas < 20000:#para casos entre 2000 e 19999 paginas o desconto de 15%
                return paginas * 0.75
            else:#função senão para casos acima de 20000 paginas
                print('Não é aceito pedidos nessa quantidade de páginas...')
                continue
        except ValueError:#exeção para digitação não numerica
            print('Ops! Numero invalido. Tente novamente...')

def servico_extra():#Função para valores adicionais
    valor = 0 #contador
    while True:
        #Mensagens de menu de opções
        print('1 - Encadernação simples R$ 15,00')
        print('2 - Encadernação de capa dura R$ 40,00'),
        print('0 - Não desejo mais nada')

        servico_adicional = input('Deseja adicionar mais algum serviço?')
        if servico_adicional == '1':#função para adicionar valor ao contador
            valor += 15#valor da opção 1
        elif servico_adicional == '2':
            valor += 40#valor da opção 2
        elif servico_adicional == '0':#função para seleção da opção 0
            return valor
        else:
            print('Opção invalida, tente novamente...')

servico = escolha_servico() #execução de função
paginas = num_paginas()#execução de função
adicional = servico_extra()#execução de função
valor_real = servico * paginas + adicional#calculo de valores a pagar

#Mensagem de apresentação de funções, calculos e valores a pagar
print('Valor R$ {:.2f} (serviço: {} * paginas: {} + extra(s): {})'. format(valor_real, servico, paginas, adicional))