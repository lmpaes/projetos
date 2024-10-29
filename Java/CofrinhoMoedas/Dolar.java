package empresa;

//Classe filha de Moeda

public class Dolar extends Moeda {
    public Dolar(double valor) {
        super(valor);
    }

    @Override
    public double converter() {
        return valor * 5.10; // Taxa de câmbio dia 18/05/2024
    }
}
