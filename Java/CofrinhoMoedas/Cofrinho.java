package empresa;

import java.util.ArrayList;


public class Cofrinho {
    private ArrayList<Moeda> listaMoedas;

    public Cofrinho() {
        listaMoedas = new ArrayList<>();
    }

    public void adicionar(Moeda moeda) {
        for (Moeda m : listaMoedas) {
            if (m.equals(moeda)) {
                m.aumentarValor(moeda.valor);
                return;
            }
        }
        listaMoedas.add(moeda); // Adiciona a moeda na lista de moedas do cofrinho
    }

    public void remover(Moeda moeda, double valor) {
        for (Moeda m : listaMoedas) {
            if (m.getClass() == moeda.getClass() && m.valor >= valor) {
                m.diminuirValor(valor);
                if (m.valor == 0) {
                    listaMoedas.remove(m);// Remove o valor indicado da moeda selecionada na lista de moedas do cofrinho
                }
                return;
            }
        }
        System.out.println("Não foi possível remover a moeda. Valor insuficiente ou moeda não encontrada.");
    }

    public void listagemMoedas() {
        for (Moeda moeda : listaMoedas) {
            System.out.println(moeda.info());
        }
    } // listagem de moedas incluidas na lista

    public double totalConvertido() {
        double total = 0.0;
        for (Moeda moeda : listaMoedas) {
            total += moeda.converter();
        }
        return total;
    }// conversor de moedas incluidas na lista
}

