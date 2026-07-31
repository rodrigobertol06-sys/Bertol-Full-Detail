// diluicao.js - Módulo de cálculo de diluição e custos
export function calcularDilucao(capacidadeRecipienteMl, proporcaoProduto, custoLitroProduto) {
    const mlProduto = capacidadeRecipienteMl / proporcaoProduto;
    const mlAgua = capacidadeRecipienteMl - mlProduto;
    const custoPorMl = custoLitroProduto / 1000;
    const custoTotalUso = mlProduto * custoPorMl;

    return {
        produtoMl: mlProduto.toFixed(1),
        aguaMl: mlAgua.toFixed(1),
        custoUso: custoTotalUso.toFixed(2)
    };
}
