package empresa;

import java.util.Scanner;

public class Principal {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        Cofrinho cofrinho = new Cofrinho(); // ler entrada do teclado
        int opcao;

        do {
            System.out.println("Menu do Cofrinho:");
            System.out.println("1. Adicionar Moeda");
            System.out.println("2. Remover Moeda");
            System.out.println("3. Listar Moedas");
            System.out.println("4. Calcular Total em Reais");
            System.out.println("5. Sair");
            System.out.print("Escolha uma opção: ");
            opcao = scanner.nextInt(); //leitura de opçao selecionada pelo usuario

            switch (opcao) {
                case 1: // Seleçao de opçao adicionar moeda
                    adicionarMoeda(scanner, cofrinho);
                    break;
                case 2: // Seleçao de opçao remover moeda
                    removerMoeda(scanner, cofrinho);
                    break;
                case 3:// Seleçao de opçao listar moeda
                    cofrinho.listagemMoedas(); 
                    break;
                case 4: // Seleçao de opçao total convertido em real
                    System.out.printf("Total em Reais: R$ %.2f%n", cofrinho.totalConvertido());
                    break;
                case 5: // Seleçao de opçao "Sair"
                    System.out.println("Encerrando programa.");
                    break;
                default: // Seleçao de opçao opçao fora do menu
                    System.out.println("Opção inválida!");
            }
        } while (opcao != 5);

        scanner.close();
    }

    private static void adicionarMoeda(Scanner scanner, Cofrinho cofrinho) {
        System.out.println("Escolha o tipo de moeda para adicionar:");
        System.out.println("1. Dólar");
        System.out.println("2. Euro");
        System.out.println("3. Real");
        int tipo = scanner.nextInt(); // leitura de opçao selecionada para adiçao de moeda

        System.out.print("Digite o valor da moeda: ");
        double valor = scanner.nextDouble();

        switch (tipo) {
            case 1:
                cofrinho.adicionar(new Dolar(valor));
                break;
            case 2:
                cofrinho.adicionar(new Euro(valor));
                break;
            case 3:
                cofrinho.adicionar(new Real(valor));
                break;
            default:
                System.out.println("Tipo de moeda inválido!");
        }
    }

    private static void removerMoeda(Scanner scanner, Cofrinho cofrinho) {
        System.out.println("Escolha o tipo de moeda para remover:");
        System.out.println("1. Dólar");
        System.out.println("2. Euro");
        System.out.println("3. Real");
        int tipo = scanner.nextInt();

        System.out.print("Digite o valor a ser removido: ");
        double valor = scanner.nextDouble(); // leitura de opçao selecionada para remoçao de moeda

        Moeda moeda = null;
        switch (tipo) {
            case 1:
                moeda = new Dolar(valor);
                break;
            case 2:
                moeda = new Euro(valor);
                break;
            case 3:
                moeda = new Real(valor);
                break;
            default:
                System.out.println("Tipo de moeda inválido!");
                return;
        }

        cofrinho.remover(moeda, valor);// funçao para remoçao de valor digitado
    }
}
