<script>
    export let root;
    export let size = 0;
    export let name = "";
    export let isChild = false;
</script>

{#if !isChild}
    <h3>
        {#if name}
            Дерево {name}
        {/if}
        {#if size !== null}
            - ({size} элементов)
        {/if}
    </h3>
{/if}

{#if root}
    {#if !isChild}
        Корень
    {/if}
    <div class="node">
        <div class="key">
            <pre style="margin: 0">{JSON.stringify(root.key, null, 1)}</pre>
        </div>
        <div class="branches">
            {#if root.left}
                Левый потомок<svelte:self root={root.left} isChild={true} />
            {/if}
            {#if root.right}
                Правый потомок<svelte:self root={root.right} isChild={true} />
            {/if}
        </div>
    </div>
{/if}

<style>
    .node {
        border: 1px solid #ccc;
        padding: 4px;
        margin: 4px;
    }
    .key {
        font-weight: bold;
    }
    .branches {
        margin-left: 20px;
    }
</style>
