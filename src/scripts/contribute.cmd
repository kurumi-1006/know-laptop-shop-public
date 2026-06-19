$stats = @{}
$currentAuthor = ""

git log --all --numstat --format="%aN" | ForEach-Object {
    $line = $_

    if ($line -match '^\s*$') {
        return
    }

    if ($line -notmatch '^\d+|-') {
        $currentAuthor = $line

        if (-not $stats.ContainsKey($currentAuthor)) {
            $stats[$currentAuthor] = @{
                Added = 0
                Deleted = 0
            }
        }

        return
    }

    $parts = $line -split "`t"

    if ($parts.Length -ge 3 -and $parts[0] -match '^\d+$' -and $parts[1] -match '^\d+$') {
        $stats[$currentAuthor].Added += [int]$parts[0]
        $stats[$currentAuthor].Deleted += [int]$parts[1]
    }
}

$stats.GetEnumerator() |
    Sort-Object { $_.Value.Added + $_.Value.Deleted } -Descending |
    ForEach-Object {
        $author = $_.Key
        $added = $_.Value.Added
        $deleted = $_.Value.Deleted
        $total = $added + $deleted

        "${author}: +${added} -${deleted} total=${total}"
    }