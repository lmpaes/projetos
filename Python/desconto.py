print('Bem-Vindo a Loja do Leonardo Paes') #Mensagem de boas vindas

#Input para identificar o valor do produto e a quantidade comprada, em seguida realizar a multiplicação para saber o total
x = float(input('Digite o valor unitario do produto: R$ ')) #Utilizar ponto para separar o real do centavo
y = int(input('Digite a quantidade que deseja comprar: '))
total = x * y

if total < 2500: #Mensagem de desconto para produtos abaixo de R$2.500
    print('Valor do produto é R$ {} e não houve desconto'.format(total))
elif total <= 6000: # Calculo + Mensagem de desconto para produtos abaixo de R$6.000
    desconto = total * 0.04
    valor_real = total - desconto
    print('PARABENS!! Você ganhou um desconto de 4%, equivalente a R$ {:.2f}'. format(desconto))
    print('O Produto custava R$ {:.2f} e você pagará R$ {:.2f}!!!'.format(total, valor_real))
elif total <= 10000: # Calculo + Mensagem de desconto para produtos abaixo de R$10.000
    desconto = total * 0.07
    valor_real = total - desconto
    print('PARABENS!! Você ganhou um desconto de 7%, equivalente a R$ {:.2f}'.format(desconto))
    print('O Produto custava R$ {:.2f} e você pagará R$ {:.2f}!!!'.format(total, valor_real))
else:# Calculo + Mensagem de desconto para produtos acima de R$10.000
    desconto = total * 0.11
    valor_real = total - desconto
    print('PARABENS!! Você ganhou um desconto de 11%, equivalente a R$ {:.2f}'.format(desconto))
    print('O Produto custava R$ {:.2f} e você pagará R$ {:.2f}!!!'.format(total, valor_real))