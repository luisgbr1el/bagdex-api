# BagdexAPI
Uma API simples que possibilita obter dados do bestiário do jogo **[Bagdex](https://caramelogames.com.br/#/dex)**.

## Endpoints
Lista de *endpoints* já disponíveis na API.

### `/status`
Checar o status atual da API.

#### Parâmetros
> Esse *endpoint* não possui parâmetros.

#### Resposta
```json
{
    "name": "BagdexAPI",
    "status": "OK",
    "version": "1.0.0"
}
```

### `/types`
Listar os tipos de Bagmon do jogo.

#### Parâmetros
- **id** (opcional)

    Retornará o tipo correspondente ao Id fornecido. (**Ex:** `/types?id=1`)
- **weaknesses** (opcional)

    Retornará todos os tipos que possuírem as fraquezas fornecidas. Múltiplas fraquezas devem ser separadas por vírgula. (**Ex:** `/types?weaknesses=1,2`)

#### Resposta
```json
[
    {
        "id": 13,
        "name": "vegetal",
        "weaknesses": [
            7
        ],
        "artwork": null
    }
]
```
