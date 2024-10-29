package empresa;

//Classe abstrata, mae de Dolar, Euro e Real

public abstract class Moeda {
    protected double valor;

    public Moeda(double valor) {
        this.valor = valor;
    }

    public abstract double converter();

    public String info() {
        return String.format("%.2f %s", valor, getClass().getSimpleName());
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        Moeda moeda = (Moeda) obj;
        return getClass() == moeda.getClass();
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    public void aumentarValor(double valor) {
        this.valor += valor;
    }

    public void diminuirValor(double valor) {
        this.valor -= valor;
    }
}
