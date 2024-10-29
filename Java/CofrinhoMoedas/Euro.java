package empresa;

//Classe filha de Moeda

public class Euro extends Moeda {
    public Euro(double valor) {
        super(valor);
    }

    @Override
    public double converter() {
        return valor * 5.56; // Taxa de câmbio dia 18/05/2024
    }
}
